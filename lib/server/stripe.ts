import Stripe from "stripe";

import { PLAN_TIERS, type PlanTier } from "@/lib/contracts/plans";

import { apiError, apiSuccess, ApiError } from "./apiErrors";
import { createTrustedSupabaseServerClient } from "./audit";
import { observeBillingWebhook } from "./observability";

type DbResult = {
  error: { message?: string } | null;
};

type DbSelectResult = DbResult & {
  data?: Array<Record<string, unknown>> | null;
};

type StripeWebhookFilter = {
  eq: (
    column: string,
    value: unknown,
  ) => StripeWebhookFilter;
  limit: (count: number) => PromiseLike<DbSelectResult>;
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => StripeWebhookFilter;
};

export type StripeWebhookSupabaseClient = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => PromiseLike<DbResult>;
    select: (columns?: string) => StripeWebhookFilter;
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => PromiseLike<DbResult>;
    };
    upsert: (
      values: Record<string, unknown>,
      options?: { onConflict?: string },
    ) => PromiseLike<DbResult>;
  };
};

export type StripeCheckoutInput = {
  customerId?: string | null;
  email?: string | null;
  origin: string;
  planTier: Exclude<PlanTier, "free">;
  userId: string;
};

export type StripePortalInput = {
  customerId: string;
  origin: string;
};

export type StripeWebhookDeps = {
  constructEvent?: (
    rawBody: string,
    signature: string,
    secret: string,
  ) => Stripe.Event;
  syncEvent?: (event: Stripe.Event) => Promise<void>;
};

export type StripeSyncDeps = {
  client?: StripeWebhookSupabaseClient;
  retrieveSubscription?: (subscriptionId: string) => Promise<Stripe.Subscription>;
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "past_due",
  "trialing",
]);

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  stripeClient ??= new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  return stripeClient;
}

export function getStripePriceId(planTier: Exclude<PlanTier, "free">) {
  if (planTier === "pro") {
    return requireEnv("STRIPE_PRO_PRICE_ID");
  }

  return requireEnv("STRIPE_STUDIO_PRICE_ID");
}

export async function createCheckoutSession(input: StripeCheckoutInput) {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    allow_promotion_codes: true,
    client_reference_id: input.userId,
    customer: input.customerId || undefined,
    customer_email: input.customerId ? undefined : input.email || undefined,
    line_items: [{ price: getStripePriceId(input.planTier), quantity: 1 }],
    metadata: {
      planTier: input.planTier,
      userId: input.userId,
    },
    mode: "subscription",
    subscription_data: {
      metadata: {
        planTier: input.planTier,
        userId: input.userId,
      },
    },
    success_url: `${input.origin}/account?checkout=success`,
    cancel_url: `${input.origin}/pricing?checkout=canceled`,
  });

  if (!session.url) {
    throw new ApiError("INTERNAL_ERROR", "Stripe checkout did not return a URL.");
  }

  return session.url;
}

export async function createBillingPortalSession(input: StripePortalInput) {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: input.customerId,
    return_url: `${input.origin}/account`,
  });

  if (!session.url) {
    throw new ApiError("INTERNAL_ERROR", "Stripe portal did not return a URL.");
  }

  return session.url;
}

export async function handleStripeWebhookRequest(
  request: Request,
  deps: StripeWebhookDeps = {},
) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    await observeBillingWebhook({
      outcome: "rejected",
      reason: "missing_signature",
    });

    return apiError("INVALID_REQUEST", "Missing Stripe signature.");
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = (deps.constructEvent ?? constructStripeWebhookEvent)(
      rawBody,
      signature,
      requireEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch {
    await observeBillingWebhook({
      outcome: "rejected",
      reason: "invalid_signature",
    });

    return apiError("INVALID_REQUEST", "Invalid Stripe signature.");
  }

  try {
    await (deps.syncEvent ?? syncStripeWebhookEvent)(event);
  } catch (error) {
    await observeBillingWebhook({
      eventId: event.id,
      outcome: "failed",
      reason: error instanceof ApiError ? error.code : "sync_failed",
      stripeEventType: event.type,
      userId: stripeEventUserId(event),
    });

    if (error instanceof ApiError) {
      return apiError(error.code, error.message, { status: error.status });
    }

    return apiError("INTERNAL_ERROR", "Failed to process Stripe webhook.");
  }

  await observeBillingWebhook({
    eventId: event.id,
    outcome: "processed",
    stripeEventType: event.type,
    userId: stripeEventUserId(event),
  });

  return apiSuccess({ received: true as const });
}

export function constructStripeWebhookEvent(
  rawBody: string,
  signature: string,
  secret: string,
) {
  return getStripeClient().webhooks.constructEvent(rawBody, signature, secret);
}

export async function syncStripeWebhookEvent(
  event: Stripe.Event,
  deps: StripeSyncDeps = {},
) {
  if (event.type === "checkout.session.completed") {
    await syncCheckoutCompleted(
      event.data.object as Stripe.Checkout.Session,
      deps,
    );
    return;
  }

  if (event.type === "customer.subscription.updated") {
    await syncSubscription(event.data.object as Stripe.Subscription, deps, {
      eventType: "billing.subscription.updated",
    });
    return;
  }

  if (event.type === "customer.subscription.deleted") {
    await syncSubscription(event.data.object as Stripe.Subscription, deps, {
      deleted: true,
      eventType: "billing.subscription.deleted",
    });
  }
}

function getWebhookClient(client?: StripeWebhookSupabaseClient) {
  return (
    client ??
    (createTrustedSupabaseServerClient() as unknown as StripeWebhookSupabaseClient)
  );
}

async function syncCheckoutCompleted(
  session: Stripe.Checkout.Session,
  deps: StripeSyncDeps,
) {
  const userId = getString(session.client_reference_id) ?? metadataString(session, "userId");
  const customerId = getStripeId(session.customer);
  const subscriptionId = getStripeId(session.subscription);

  if (!userId || !customerId || !subscriptionId) {
    throw new ApiError(
      "INVALID_REQUEST",
      "Checkout session is missing billing identity.",
    );
  }

  const subscription = isExpandedSubscription(session.subscription)
    ? session.subscription
    : await (deps.retrieveSubscription ?? retrieveStripeSubscription)(
        subscriptionId,
      );

  await syncSubscription(subscription, deps, {
    customerId,
    eventType: "billing.checkout.completed",
    fallbackPlanTier: metadataPlanTier(session) ?? undefined,
    userId,
  });
}

async function syncSubscription(
  subscription: Stripe.Subscription,
  deps: StripeSyncDeps,
  options: {
    customerId?: string;
    deleted?: boolean;
    eventType: string;
    fallbackPlanTier?: PlanTier;
    userId?: string;
  },
) {
  const client = getWebhookClient(deps.client);
  const subscriptionId = subscription.id;
  const customerId = options.customerId ?? getStripeId(subscription.customer);
  const existing = options.userId
    ? null
    : await findSubscriptionByStripeId(client, subscriptionId);
  const userId =
    options.userId ??
    metadataString(subscription, "userId") ??
    stringField(existing, "user_id");

  if (!userId || !customerId) {
    throw new ApiError(
      "INVALID_REQUEST",
      "Subscription event is missing billing identity.",
    );
  }

  const planTier =
    pricePlanTier(subscription) ??
    metadataPlanTier(subscription) ??
    options.fallbackPlanTier ??
    (isPlanTier(existing?.plan_tier) ? existing.plan_tier : "free");
  const trustedPlanTier = options.deleted
    ? "free"
    : ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)
      ? planTier
      : "free";

  await upsertSubscription(client, {
    cancel_at_period_end: subscription.cancel_at_period_end,
    current_period_end: timestampToIso(subscriptionPeriodEnd(subscription)),
    plan_tier: planTier,
    status: subscription.status,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    user_id: userId,
  });
  await updateProfileBilling(client, userId, {
    plan_tier: trustedPlanTier,
    stripe_customer_id: customerId,
  });
  await recordBillingAudit(client, {
    actorId: userId,
    eventType: options.eventType,
    metadata: {
      planTier,
      profilePlanTier: trustedPlanTier,
      status: subscription.status,
      stripeCustomerId: customerId,
      stripeEventDeleted: Boolean(options.deleted),
      stripeSubscriptionId: subscriptionId,
    },
  });
}

async function retrieveStripeSubscription(subscriptionId: string) {
  return getStripeClient().subscriptions.retrieve(subscriptionId);
}

async function findSubscriptionByStripeId(
  client: StripeWebhookSupabaseClient,
  subscriptionId: string,
) {
  const result = await client
    .from("subscriptions")
    .select("user_id,plan_tier,stripe_subscription_id")
    .eq("stripe_subscription_id", subscriptionId)
    .limit(1);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read subscription.");
  }

  return result.data?.[0] ?? null;
}

async function upsertSubscription(
  client: StripeWebhookSupabaseClient,
  values: Record<string, unknown>,
) {
  const result = await client.from("subscriptions").upsert(values, {
    onConflict: "stripe_subscription_id",
  });

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to sync subscription.");
  }
}

async function updateProfileBilling(
  client: StripeWebhookSupabaseClient,
  userId: string,
  values: { plan_tier: PlanTier; stripe_customer_id: string },
) {
  const result = await client.from("profiles").update(values).eq("id", userId);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to sync profile billing.");
  }
}

async function recordBillingAudit(
  client: StripeWebhookSupabaseClient,
  event: {
    actorId: string;
    eventType: string;
    metadata: Record<string, unknown>;
  },
) {
  const result = await client.from("audit_events").insert({
    actor_id: event.actorId,
    event_type: event.eventType,
    metadata: event.metadata,
    target_id: null,
    target_type: "subscription",
    workspace_id: null,
  });

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to record billing audit.");
  }
}

function pricePlanTier(subscription: Stripe.Subscription): PlanTier | null {
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    return null;
  }

  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return "pro";
  }

  if (priceId === process.env.STRIPE_STUDIO_PRICE_ID) {
    return "studio";
  }

  return null;
}

function metadataPlanTier(object: { metadata?: Stripe.Metadata | null }) {
  const value = object.metadata?.planTier;
  return isPlanTier(value) ? value : null;
}

function metadataString(
  object: { metadata?: Stripe.Metadata | null },
  key: string,
) {
  return getString(object.metadata?.[key]);
}

function stripeEventUserId(event: Stripe.Event) {
  const object = event.data.object as {
    client_reference_id?: unknown;
    metadata?: Stripe.Metadata | null;
  };

  return getString(object.client_reference_id) ?? metadataString(object, "userId");
}

function isPlanTier(value: unknown): value is PlanTier {
  return PLAN_TIERS.includes(value as PlanTier);
}

function isExpandedSubscription(
  value: string | Stripe.Subscription | null,
): value is Stripe.Subscription {
  return Boolean(value && typeof value === "object" && value.object === "subscription");
}

function getStripeId(value: string | { id?: string } | null) {
  if (typeof value === "string") {
    return value;
  }

  return getString(value?.id);
}

function getString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function stringField(row: Record<string, unknown> | null, field: string) {
  const value = row?.[field];
  return typeof value === "string" ? value : null;
}

function timestampToIso(timestamp: number | null) {
  return typeof timestamp === "number"
    ? new Date(timestamp * 1000).toISOString()
    : null;
}

function subscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const legacyValue = (subscription as unknown as { current_period_end?: unknown })
    .current_period_end;
  if (typeof legacyValue === "number") {
    return legacyValue;
  }

  return subscription.items.data[0]?.current_period_end ?? null;
}

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}`);
  }

  return value;
}
