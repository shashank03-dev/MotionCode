import type { PlanTier } from "@/lib/contracts/plans";
import type { Json } from "@/types/database";

export const SUPPORT_TICKET_STATUSES = ["open", "pending", "closed"] as const;
export const SUPPORT_TICKET_PRIORITIES = [
  "standard",
  "priority",
  "urgent",
] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];
export type SupportTicketPriority = (typeof SUPPORT_TICKET_PRIORITIES)[number];

export type SupportTicketDTO = {
  id: string;
  userId: string;
  assignedAdminId: string | null;
  subject: string;
  body: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: string;
  updatedAt: string;
};

export type AdminProfileSummary = {
  id: string;
  email: string;
  displayName: string | null;
  planTier: PlanTier;
  isInternalAdmin: boolean;
};

export type AdminSupportTicketDTO = SupportTicketDTO & {
  requester: AdminProfileSummary | null;
  assignee: AdminProfileSummary | null;
};

export type AdminPlanOverrideDTO = {
  id: string;
  userId: string;
  createdBy: string;
  planTier: PlanTier;
  reason: string;
  expiresAt: string | null;
  createdAt: string;
};

export type AdminUserDTO = AdminProfileSummary & {
  createdAt: string;
  billingCustomerId: string | null;
  updatedAt: string;
  latestOverride: AdminPlanOverrideDTO | null;
};

export type AdminAuditEventDTO = {
  id: string;
  actorId: string | null;
  workspaceId: string | null;
  eventType: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Json;
  createdAt: string;
};

export type AdminEarlyAccessSignupDTO = {
  createdAt: string;
  desiredPlan: "pro" | "studio";
  email: string | null;
  status: "requested" | "invited" | "converted" | "closed";
  userId: string;
};

export type AdminDashboardDTO = {
  counts: {
    earlyAccessRequests: number;
    openTickets: number;
    pendingTickets: number;
    users: number;
  };
  recentEarlyAccessSignups: AdminEarlyAccessSignupDTO[];
  recentAuditEvents: AdminAuditEventDTO[];
  recentTickets: AdminSupportTicketDTO[];
  recentUsers: AdminUserDTO[];
};
