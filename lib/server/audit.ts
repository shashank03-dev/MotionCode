import type { PlanTier } from "@/lib/contracts/plans";
import type { Json } from "@/types/database";

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

export async function recordAuditEvent(
  recorder: AuditRecorder,
  event: AuditEventInput,
) {
  await recorder.record(event);
}
