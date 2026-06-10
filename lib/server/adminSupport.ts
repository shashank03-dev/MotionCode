import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  PLAN_TIERS,
  type PlanTier,
} from "@/lib/contracts/plans";
import {
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_STATUSES,
  type AdminAuditEventDTO,
  type AdminDashboardDTO,
  type AdminPlanOverrideDTO,
  type AdminProfileSummary,
  type AdminSupportTicketDTO,
  type AdminUserDTO,
  type SupportTicketDTO,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from "@/lib/contracts/adminSupport";
import {
  countRequestedEarlyAccessSignups,
  listRecentEarlyAccessSignups,
} from "@/lib/server/earlyAccessAdmin";
import {
  createSupabaseAuditRecorder,
  type SupabaseInsertClient,
} from "@/lib/server/audit";
import { ApiError } from "@/lib/server/apiErrors";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SupportTicketRow =
  Database["public"]["Tables"]["support_tickets"]["Row"];
type AdminPlanOverrideRow =
  Database["public"]["Tables"]["admin_plan_overrides"]["Row"];
type AuditEventRow = Database["public"]["Tables"]["audit_events"]["Row"];

type SupabaseErrorLike = { message?: string } | null;
type SupabaseSingleResult<T> = {
  data: T | null;
  error: SupabaseErrorLike;
};

type AdminSupportTicketUpdate = Partial<{
  assigned_admin_id: string | null;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  updated_at: string;
}>;

type AdminSupportTicketUpdateTable = {
  update: (values: AdminSupportTicketUpdate) => {
    eq: (column: "id", value: string) => {
      select: (columns: string) => {
        single: () => PromiseLike<SupabaseSingleResult<SupportTicketRow>>;
      };
    };
  };
};

type AdminProfileUpdateTable = {
  update: (values: { plan_tier: PlanTier; updated_at: string }) => {
    eq: (
      column: "id",
      value: string,
    ) => PromiseLike<{ error: SupabaseErrorLike }>;
  };
};

const SUPPORT_TICKET_COLUMNS =
  "id,user_id,assigned_admin_id,subject,body,status,priority,created_at,updated_at";
const PROFILE_COLUMNS =
  "id,email,display_name,plan_tier,razorpay_customer_id,is_internal_admin,created_at,updated_at";
const ADMIN_PLAN_OVERRIDE_COLUMNS =
  "id,user_id,created_by,plan_tier,reason,expires_at,created_at";

export const SupportTicketCreateSchema = z.object({
  body: z.string().trim().min(10).max(4000),
  subject: z.string().trim().min(3).max(160),
});

export const AdminSupportTicketUpdateSchema = z
  .object({
    assignedAdminId: z.string().uuid().nullable().optional(),
    priority: z.enum(SUPPORT_TICKET_PRIORITIES).optional(),
    status: z.enum(SUPPORT_TICKET_STATUSES).optional(),
  })
  .refine(
    (value) =>
      value.assignedAdminId !== undefined ||
      value.priority !== undefined ||
      value.status !== undefined,
    "At least one ticket field is required.",
  );

export const AdminPlanOverrideCreateSchema = z.object({
  expiresAt: z
    .preprocess((value) => (value === "" ? null : value), z.string().datetime().nullable())
    .optional(),
  planTier: z.enum(PLAN_TIERS),
  reason: z.string().trim().min(5).max(600),
});

export async function listOwnSupportTickets(
  client: SupabaseClient<Database>,
  userId: string,
  limit = 50,
): Promise<SupportTicketDTO[]> {
  const { data, error } = await client
    .from("support_tickets")
    .select(SUPPORT_TICKET_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read support tickets.");
  }

  return (data ?? []).map(toSupportTicketDTO);
}

export async function createSupportTicket(
  client: SupabaseClient<Database>,
  userId: string,
  input: z.infer<typeof SupportTicketCreateSchema>,
): Promise<SupportTicketDTO> {
  const { data, error } = await client
    .from("support_tickets")
    .insert({
      body: input.body,
      subject: input.subject,
      user_id: userId,
    })
    .select(SUPPORT_TICKET_COLUMNS)
    .single();

  if (error || !data) {
    throw new ApiError("INTERNAL_ERROR", "Failed to create support ticket.");
  }

  return toSupportTicketDTO(data);
}

export async function listAdminSupportTickets(
  client: SupabaseClient<Database>,
  limit = 100,
): Promise<AdminSupportTicketDTO[]> {
  const { data, error } = await client
    .from("support_tickets")
    .select(SUPPORT_TICKET_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read support tickets.");
  }

  const tickets = (data ?? []) as SupportTicketRow[];
  const profiles = await loadProfileMap(
    client,
    tickets.flatMap((ticket) => [
      ticket.user_id,
      ticket.assigned_admin_id,
    ]),
  );

  return tickets.map((ticket) => ({
    ...toSupportTicketDTO(ticket),
    assignee: ticket.assigned_admin_id
      ? profiles.get(ticket.assigned_admin_id) ?? null
      : null,
    requester: profiles.get(ticket.user_id) ?? null,
  }));
}

export async function updateAdminSupportTicket(
  client: SupabaseClient<Database>,
  actorId: string,
  ticketId: string,
  input: z.infer<typeof AdminSupportTicketUpdateSchema>,
): Promise<AdminSupportTicketDTO> {
  const update: AdminSupportTicketUpdate = {
    updated_at: new Date().toISOString(),
  };
  if (input.assignedAdminId !== undefined) {
    update.assigned_admin_id = input.assignedAdminId;
  }
  if (input.priority) {
    update.priority = input.priority;
  }
  if (input.status) {
    update.status = input.status;
  }

  const table = client.from(
    "support_tickets",
  ) as unknown as AdminSupportTicketUpdateTable;
  const { data, error } = await table
    .update(update)
    .eq("id", ticketId)
    .select(SUPPORT_TICKET_COLUMNS)
    .single();

  if (error || !data) {
    throw new ApiError("NOT_FOUND", "Support ticket was not found.");
  }

  await createSupabaseAuditRecorder({
    client: client as unknown as SupabaseInsertClient,
  }).record({
    actorId,
    eventType: "support.ticket.updated",
    metadata: {
      assignedAdminId: input.assignedAdminId ?? null,
      priority: input.priority ?? null,
      status: input.status ?? null,
    },
    targetId: ticketId,
    targetType: "support_ticket",
  });

  const profiles = await loadProfileMap(client, [
    data.user_id,
    data.assigned_admin_id,
  ]);

  return {
    ...toSupportTicketDTO(data),
    assignee: data.assigned_admin_id
      ? profiles.get(data.assigned_admin_id) ?? null
      : null,
    requester: profiles.get(data.user_id) ?? null,
  };
}

export async function listAdminUsers(
  client: SupabaseClient<Database>,
  limit = 100,
): Promise<AdminUserDTO[]> {
  const { data, error } = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read users.");
  }

  const profiles = (data ?? []) as ProfileRow[];
  const overrides = await loadLatestOverrides(
    client,
    profiles.map((profile) => profile.id),
  );

  return profiles.map((profile) => ({
    ...toProfileSummary(profile),
    createdAt: profile.created_at,
    latestOverride: overrides.get(profile.id) ?? null,
    billingCustomerId: profile.razorpay_customer_id,
    updatedAt: profile.updated_at,
  }));
}

export async function createAdminPlanOverride(
  client: SupabaseClient<Database>,
  actorId: string,
  userId: string,
  input: z.infer<typeof AdminPlanOverrideCreateSchema>,
): Promise<AdminPlanOverrideDTO> {
  const { data: targetUser, error: targetError } = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (targetError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read user.");
  }

  if (!targetUser) {
    throw new ApiError("NOT_FOUND", "User was not found.");
  }

  const { data: override, error: overrideError } = await client
    .from("admin_plan_overrides")
    .insert({
      created_by: actorId,
      expires_at: input.expiresAt ?? null,
      plan_tier: input.planTier,
      reason: input.reason,
      user_id: userId,
    })
    .select(ADMIN_PLAN_OVERRIDE_COLUMNS)
    .single();

  if (overrideError || !override) {
    throw new ApiError("INTERNAL_ERROR", "Failed to create plan override.");
  }

  const profileTable = client.from(
    "profiles",
  ) as unknown as AdminProfileUpdateTable;
  const profileUpdate = await profileTable
    .update({
      plan_tier: input.planTier,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileUpdate.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to apply plan override.");
  }

  await createSupabaseAuditRecorder({
    client: client as unknown as SupabaseInsertClient,
  }).record({
    actorId,
    eventType: "admin.plan_override.created",
    metadata: {
      expiresAt: input.expiresAt ?? null,
      overrideId: override.id,
      previousPlanTier: targetUser.plan_tier,
      reason: input.reason,
      requestedPlanTier: input.planTier,
      targetEmail: targetUser.email,
    },
    targetId: userId,
    targetType: "profile",
  });

  return toAdminPlanOverrideDTO(override);
}

export async function getAdminDashboard(
  client: SupabaseClient<Database>,
): Promise<AdminDashboardDTO> {
  const [
    openTicketCount,
    pendingTicketCount,
    userCount,
    earlyAccessRequestCount,
    recentTickets,
    recentUsers,
    recentAuditEvents,
    recentEarlyAccessSignups,
  ] = await Promise.all([
    getSupportTicketCount(client, "open"),
    getSupportTicketCount(client, "pending"),
    getUserCount(client),
    countRequestedEarlyAccessSignups(),
    listAdminSupportTickets(client, 8),
    listAdminUsers(client, 8),
    listRecentAuditEvents(client, 12),
    listRecentEarlyAccessSignups(8),
  ]);

  return {
    counts: {
      earlyAccessRequests: earlyAccessRequestCount,
      openTickets: openTicketCount,
      pendingTickets: pendingTicketCount,
      users: userCount,
    },
    recentAuditEvents,
    recentEarlyAccessSignups,
    recentTickets,
    recentUsers,
  };
}

async function getSupportTicketCount(
  client: SupabaseClient<Database>,
  status: SupportTicketStatus,
) {
  const { count, error } = await client
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to count support tickets.");
  }

  return count ?? 0;
}

async function getUserCount(client: SupabaseClient<Database>) {
  const { count, error } = await client
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to count users.");
  }

  return count ?? 0;
}

async function listRecentAuditEvents(
  client: SupabaseClient<Database>,
  limit: number,
): Promise<AdminAuditEventDTO[]> {
  const { data, error } = await client
    .from("audit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read audit events.");
  }

  return ((data ?? []) as AuditEventRow[]).map(toAdminAuditEventDTO);
}

async function loadProfileMap(
  client: SupabaseClient<Database>,
  ids: Array<string | null>,
) {
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
  const map = new Map<string, AdminProfileSummary>();
  if (uniqueIds.length === 0) {
    return map;
  }

  const { data, error } = await client
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .in("id", uniqueIds);

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read user profiles.");
  }

  for (const profile of (data ?? []) as ProfileRow[]) {
    map.set(profile.id, toProfileSummary(profile));
  }

  return map;
}

async function loadLatestOverrides(
  client: SupabaseClient<Database>,
  userIds: string[],
) {
  const map = new Map<string, AdminPlanOverrideDTO>();
  if (userIds.length === 0) {
    return map;
  }

  const { data, error } = await client
    .from("admin_plan_overrides")
    .select(ADMIN_PLAN_OVERRIDE_COLUMNS)
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read plan overrides.");
  }

  for (const override of (data ?? []) as AdminPlanOverrideRow[]) {
    if (!map.has(override.user_id)) {
      map.set(override.user_id, toAdminPlanOverrideDTO(override));
    }
  }

  return map;
}

function toSupportTicketDTO(row: SupportTicketRow): SupportTicketDTO {
  return {
    assignedAdminId: row.assigned_admin_id,
    body: row.body,
    createdAt: row.created_at,
    id: row.id,
    priority: row.priority,
    status: row.status,
    subject: row.subject,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}

function toProfileSummary(row: ProfileRow): AdminProfileSummary {
  return {
    displayName: row.display_name,
    email: row.email,
    id: row.id,
    isInternalAdmin: row.is_internal_admin,
    planTier: row.plan_tier,
  };
}

function toAdminPlanOverrideDTO(
  row: AdminPlanOverrideRow,
): AdminPlanOverrideDTO {
  return {
    createdAt: row.created_at,
    createdBy: row.created_by,
    expiresAt: row.expires_at,
    id: row.id,
    planTier: row.plan_tier,
    reason: row.reason,
    userId: row.user_id,
  };
}

function toAdminAuditEventDTO(row: AuditEventRow): AdminAuditEventDTO {
  return {
    actorId: row.actor_id,
    createdAt: row.created_at,
    eventType: row.event_type,
    id: row.id,
    metadata: row.metadata,
    targetId: row.target_id,
    targetType: row.target_type,
    workspaceId: row.workspace_id,
  };
}
