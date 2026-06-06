import { createClient } from "@supabase/supabase-js";

import type { PlanTier } from "@/lib/contracts/plans";
import type { Json } from "@/types/database";

import { ApiError } from "./apiErrors";
import { getServerEnv, type ServerEnv } from "./env";

export type AuditEventInput = {
  actorId: string | null;
  eventType: string;
  metadata?: Json;
  targetId?: string | null;
  targetType?: string | null;
  workspaceId?: string | null;
};

export type AuditRecorder = {
  record: (event: AuditEventInput) => Promise<void>;
};

export type UsageEventInput = {
  eventType: string;
  frameCount?: number | null;
  model?: string | null;
  planTier: PlanTier;
  projectId?: string | null;
  userId: string;
  workspaceId?: string | null;
};

export type UsageEventRecorder = {
  record: (event: UsageEventInput) => Promise<void>;
};

type TrustedSupabaseConfig = Pick<
  ServerEnv,
  "supabaseServiceRoleKey" | "supabaseUrl"
>;

type SupabaseInsertResult = {
  error: { message?: string } | null;
};

type SupabaseSelectResult = {
  count?: number | null;
  data?: Array<Record<string, unknown>> | null;
  error: { message?: string } | null;
};

type SupabaseInsertBuilder = {
  insert: (
    values: Record<string, unknown>,
  ) => PromiseLike<SupabaseInsertResult> | SupabaseInsertResult;
  select: (
    columns?: string,
    options?: { count?: "exact"; head?: boolean },
  ) => SupabaseFilterBuilder;
};

type SupabaseFilterBuilder = {
  eq: (column: string, value: unknown) => SupabaseFilterBuilder;
  gte: (
    column: string,
    value: unknown,
  ) => PromiseLike<SupabaseSelectResult> | SupabaseSelectResult;
  limit: (
    count: number,
  ) => PromiseLike<SupabaseSelectResult> | SupabaseSelectResult;
  match: (query: Record<string, unknown>) => SupabaseFilterBuilder;
};

export type SupabaseInsertClient = {
  from: (table: string) => SupabaseInsertBuilder;
};

type SupabaseRecorderOptions = {
  client?: SupabaseInsertClient;
  env?: TrustedSupabaseConfig;
};

export type AnalysisResourceRequest = {
  assetId: string;
  projectId: string;
  versionId: string;
  workspaceId?: string;
};

export type AnalysisAuthorizationUser = {
  id: string;
};

export type DailyAnalysisCountInput = {
  since: Date;
  userId: string;
};

export function createNoopAuditRecorder(): AuditRecorder {
  return {
    async record() {
      // Real persistence will be wired through a trusted server write path.
    },
  };
}

export function createNoopUsageEventRecorder(): UsageEventRecorder {
  return {
    async record() {
      // Real persistence will be wired through a trusted server write path.
    },
  };
}

export function createTrustedSupabaseServerClient(
  env: TrustedSupabaseConfig = getServerEnv(),
): SupabaseInsertClient {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as unknown as SupabaseInsertClient;
}

export async function authorizeAnalysisRequestWithSupabase(
  user: AnalysisAuthorizationUser,
  request: AnalysisResourceRequest,
  options: SupabaseRecorderOptions = {},
) {
  const client = options.client ?? createTrustedSupabaseServerClient(options.env);
  const project = await findSingleRow(client, "projects", {
    id: request.projectId,
  });

  if (!project) {
    return false;
  }

  const workspaceId = stringField(project, "workspace_id");
  if (request.workspaceId && workspaceId !== request.workspaceId) {
    return false;
  }

  const ownsProject = stringField(project, "owner_id") === user.id;
  const isWorkspaceMember =
    workspaceId &&
    (await hasRow(client, "workspace_members", {
      user_id: user.id,
      workspace_id: workspaceId,
    }));

  if (!ownsProject && !isWorkspaceMember) {
    return false;
  }

  const hasAsset = await hasRow(client, "assets", {
    id: request.assetId,
    project_id: request.projectId,
  });
  if (!hasAsset) {
    return false;
  }

  return hasRow(client, "project_versions", {
    id: request.versionId,
    project_id: request.projectId,
  });
}

export async function getDailyAnalysisCountWithSupabase(
  input: DailyAnalysisCountInput,
  options: SupabaseRecorderOptions = {},
) {
  const client = options.client ?? createTrustedSupabaseServerClient(options.env);
  const result = await client
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .eq("event_type", "analysis.completed")
    .gte("created_at", input.since.toISOString());

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read usage events.");
  }

  return result.count ?? 0;
}

export function createSupabaseAuditRecorder(
  options: SupabaseRecorderOptions = {},
): AuditRecorder {
  let client = options.client;

  return {
    async record(event) {
      client ??= createTrustedSupabaseServerClient(options.env);

      const result = await client.from("audit_events").insert({
        actor_id: event.actorId,
        event_type: event.eventType,
        metadata: event.metadata ?? {},
        target_id: event.targetId ?? null,
        target_type: event.targetType ?? null,
        workspace_id: event.workspaceId ?? null,
      });

      if (result.error) {
        throw new ApiError("INTERNAL_ERROR", "Failed to record audit event.");
      }
    },
  };
}

export function createSupabaseUsageEventRecorder(
  options: SupabaseRecorderOptions = {},
): UsageEventRecorder {
  let client = options.client;

  return {
    async record(event) {
      client ??= createTrustedSupabaseServerClient(options.env);

      const result = await client.from("usage_events").insert({
        event_type: event.eventType,
        frame_count: event.frameCount ?? null,
        model: event.model ?? null,
        plan_tier: event.planTier,
        project_id: event.projectId ?? null,
        user_id: event.userId,
        workspace_id: event.workspaceId ?? null,
      });

      if (result.error) {
        throw new ApiError("INTERNAL_ERROR", "Failed to record usage event.");
      }
    },
  };
}

export async function recordAuditEvent(
  recorder: AuditRecorder,
  event: AuditEventInput,
) {
  await recorder.record(event);
}

async function findSingleRow(
  client: SupabaseInsertClient,
  table: string,
  query: Record<string, unknown>,
) {
  const result = await client.from(table).select("*").match(query).limit(1);
  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", `Failed to read ${table}.`);
  }

  return result.data?.[0] ?? null;
}

async function hasRow(
  client: SupabaseInsertClient,
  table: string,
  query: Record<string, unknown>,
) {
  return Boolean(await findSingleRow(client, table, query));
}

function stringField(row: Record<string, unknown>, field: string) {
  const value = row[field];
  return typeof value === "string" ? value : null;
}
