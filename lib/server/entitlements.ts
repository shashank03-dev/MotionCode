import {
  PLAN_ENTITLEMENTS,
  type PlanEntitlements,
  type PlanTier,
} from "@/lib/contracts/plans";

import { ApiError } from "./apiErrors";
import { createTrustedSupabaseServerClient } from "./audit";
import {
  getActivePlanOverride,
  isPlanTier,
  type PlanOverrideRow,
} from "./planOverrides";

type SupabaseSelectResult<T> = {
  count?: number | null;
  data?: T[] | null;
  error: { message?: string } | null;
};

type EntitlementsFilter<T> = {
  eq: (column: string, value: unknown) => EntitlementsFilter<T>;
  gte: (
    column: string,
    value: unknown,
  ) => PromiseLike<SupabaseSelectResult<T>>;
  limit: (count: number) => PromiseLike<SupabaseSelectResult<T>>;
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => EntitlementsFilter<T>;
};

export type EntitlementsSupabaseClient = {
  from: (table: string) => {
    select: (
      columns?: string,
      options?: { count?: "exact"; head?: boolean },
    ) => EntitlementsFilter<Record<string, unknown>>;
  };
};

type CurrentUser = {
  app_metadata?: Record<string, unknown>;
  id: string;
};

export type EntitlementSource =
  | "admin_override"
  | "default"
  | "profile"
  | "subscription";

export type ProfileEntitlementRow = {
  avatar_url?: string | null;
  display_name?: string | null;
  email?: string | null;
  id?: string;
  plan_tier?: unknown;
  stripe_customer_id?: string | null;
};

export type SubscriptionEntitlementRow = {
  cancel_at_period_end?: boolean | null;
  created_at?: string | null;
  current_period_end?: string | null;
  plan_tier?: unknown;
  status?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  user_id?: string;
};

export type EntitlementSummary = {
  entitlements: PlanEntitlements;
  override: PlanOverrideRow | null;
  planTier: PlanTier;
  profile: ProfileEntitlementRow | null;
  source: EntitlementSource;
  subscription: SubscriptionEntitlementRow | null;
  usage: {
    dailyAnalyses: {
      limit: number;
      remaining: number;
      used: number;
    };
  };
};

export type EntitlementOptions = {
  client?: EntitlementsSupabaseClient;
  now?: Date;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "past_due",
  "trialing",
]);

export async function resolvePlanTierForUser(
  user: CurrentUser,
  options: EntitlementOptions = {},
) {
  const summary = await getEntitlementSummary(user.id, options);
  return summary.planTier;
}

export async function getEntitlementSummary(
  userId: string,
  options: EntitlementOptions = {},
): Promise<EntitlementSummary> {
  const client = getEntitlementsClient(options.client);
  const now = options.now ?? new Date();

  const [profile, override, subscription, dailyAnalysisCount] =
    await Promise.all([
      readProfile(client, userId),
      getActivePlanOverride(userId, { client, now }),
      readLatestSubscription(client, userId),
      getDailyAnalysisUsage(client, userId, now),
    ]);
  const resolved = resolveTrustedPlanTier({ override, profile, subscription });
  const entitlements = PLAN_ENTITLEMENTS[resolved.planTier];

  return {
    entitlements,
    override,
    planTier: resolved.planTier,
    profile,
    source: resolved.source,
    subscription,
    usage: {
      dailyAnalyses: {
        limit: entitlements.dailyAnalyses,
        remaining: Math.max(entitlements.dailyAnalyses - dailyAnalysisCount, 0),
        used: dailyAnalysisCount,
      },
    },
  };
}

function getEntitlementsClient(client?: EntitlementsSupabaseClient) {
  return (
    client ??
    (createTrustedSupabaseServerClient() as unknown as EntitlementsSupabaseClient)
  );
}

function resolveTrustedPlanTier({
  override,
  profile,
  subscription,
}: {
  override: PlanOverrideRow | null;
  profile: ProfileEntitlementRow | null;
  subscription: SubscriptionEntitlementRow | null;
}): { planTier: PlanTier; source: EntitlementSource } {
  if (override && isPlanTier(override.plan_tier)) {
    return { planTier: override.plan_tier, source: "admin_override" };
  }

  if (subscription) {
    if (
      isPlanTier(subscription.plan_tier) &&
      subscription.status &&
      ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
    ) {
      return { planTier: subscription.plan_tier, source: "subscription" };
    }

    return { planTier: "free", source: "default" };
  }

  if (profile && isPlanTier(profile.plan_tier)) {
    return { planTier: profile.plan_tier, source: "profile" };
  }

  return { planTier: "free", source: "default" };
}

async function readProfile(
  client: EntitlementsSupabaseClient,
  userId: string,
): Promise<ProfileEntitlementRow | null> {
  const result = await client
    .from("profiles")
    .select("id,email,display_name,avatar_url,plan_tier,stripe_customer_id")
    .eq("id", userId)
    .limit(1);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read profile.");
  }

  return (result.data?.[0] as ProfileEntitlementRow | undefined) ?? null;
}

async function readLatestSubscription(
  client: EntitlementsSupabaseClient,
  userId: string,
): Promise<SubscriptionEntitlementRow | null> {
  const result = await client
    .from("subscriptions")
    .select(
      "user_id,stripe_customer_id,stripe_subscription_id,status,plan_tier,current_period_end,cancel_at_period_end,created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read subscription.");
  }

  return (result.data?.[0] as SubscriptionEntitlementRow | undefined) ?? null;
}

async function getDailyAnalysisUsage(
  client: EntitlementsSupabaseClient,
  userId: string,
  now: Date,
) {
  const since = startOfUtcDay(now).toISOString();
  const counts = await Promise.all(
    ["analysis.started", "analysis.completed"].map((eventType) =>
      getDailyUsageCountForEventType(client, userId, eventType, since),
    ),
  );

  return Math.max(...counts);
}

async function getDailyUsageCountForEventType(
  client: EntitlementsSupabaseClient,
  userId: string,
  eventType: string,
  since: string,
) {
  const result = await client
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", eventType)
    .gte("created_at", since);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read usage.");
  }

  return result.count ?? result.data?.length ?? 0;
}

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
