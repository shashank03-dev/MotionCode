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

type SupabaseInsertBuilder = {
  insert: (
    values: Record<string, unknown>,
  ) => PromiseLike<SupabaseInsertResult> | SupabaseInsertResult;
};

export type SupabaseInsertClient = {
  from: (table: string) => SupabaseInsertBuilder;
};

type SupabaseRecorderOptions = {
  client?: SupabaseInsertClient;
  env?: TrustedSupabaseConfig;
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
