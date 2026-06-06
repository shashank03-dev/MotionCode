import { PLAN_TIERS, type PlanTier } from "@/lib/contracts/plans";

import { ApiError } from "./apiErrors";
import { createTrustedSupabaseServerClient } from "./audit";

type SupabaseResult<T> = {
  data?: T[] | null;
  error: { message?: string } | null;
};

type PlanOverrideFilter = {
  eq: (column: string, value: unknown) => PlanOverrideFilter;
  limit: (count: number) => PromiseLike<SupabaseResult<PlanOverrideRow>>;
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => PlanOverrideFilter;
};

export type PlanOverrideSupabaseClient = {
  from: (table: string) => {
    select: (columns?: string) => PlanOverrideFilter;
  };
};

export type PlanOverrideRow = {
  created_at?: string | null;
  expires_at?: string | null;
  id?: string;
  plan_tier?: unknown;
  reason?: string | null;
  user_id?: string;
};

export type PlanOverrideOptions = {
  client?: PlanOverrideSupabaseClient;
  now?: Date;
};

export async function getActivePlanOverride(
  userId: string,
  options: PlanOverrideOptions = {},
) {
  const client =
    options.client ??
    (createTrustedSupabaseServerClient() as unknown as PlanOverrideSupabaseClient);
  const now = options.now ?? new Date();

  const result = await client
    .from("admin_plan_overrides")
    .select("id,user_id,plan_tier,reason,expires_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read plan overrides.");
  }

  return (
    result.data?.find(
      (row) => isPlanTier(row.plan_tier) && isOverrideActive(row, now),
    ) ?? null
  );
}

export function isPlanTier(value: unknown): value is PlanTier {
  return PLAN_TIERS.includes(value as PlanTier);
}

function isOverrideActive(row: PlanOverrideRow, now: Date) {
  if (!row.expires_at) {
    return true;
  }

  return new Date(row.expires_at).getTime() > now.getTime();
}
