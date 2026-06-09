import { createHmac, timingSafeEqual } from "node:crypto";

import { isPaidCheckoutEnabled } from "@/lib/contracts/launch";
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

type RazorpayFilter = {
  eq: (column: string, value: unknown) => RazorpayFilter;
  limit: (count: number) => PromiseLike<DbSelectResult>;
  order: (
    column: string,
    options?: { ascending?: boolean },
  ) => RazorpayFilter;
};

export type RazorpayWebhookSupabaseClient = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => PromiseLike<DbResult>;
    select: (columns?: string) => RazorpayFilter;
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => PromiseLike<DbResult>;
    };
    upsert: (
      values: Record<string, unknown>,
      options?: { onConflict?: string },
    ) => PromiseLike<DbResult>;
  };
};

export type RazorpayCheckoutInput = {
  email?: string | null;
  planTier: Exclude<PlanTier, "free">;
  userId: string;
};

export type RazorpayCheckoutPayload = {
  description: string;
  keyId: string;
  name: string;
  prefill: {
    email?: string;
  };
  subscriptionId: string;
};

export type RazorpayCheckoutVerificationInput = {
  paymentId: string;
  signature: string;
  subscriptionId: string;
  userId: string;
};

export type RazorpayDeps = {
  client?: RazorpayWebhookSupabaseClient;
  fetchRazorpay?: typeof fetch;
  retrieveSubscription?: (
    subscriptionId: string,
  ) => Promise<RazorpaySubscriptionEntity>;
};

export type RazorpayWebhookDeps = RazorpayDeps & {
  syncEvent?: (
    event: RazorpayWebhookEvent,
    options: { eventId?: string | null },
  ) => Promise<void>;
  verifyWebhookSignature?: (
    rawBody: string,
    signature: string,
    secret: string,
  ) => boolean;
};

type RazorpaySubscriptionEntity = {
  current_end?: number | null;
  customer_id?: string | null;
  id?: string;
  notes?: unknown;
  plan_id?: string | null;
  status?: string | null;
};

type RazorpayWebhookEvent = {
  event?: string;
  payload?: {
    subscription?: {
      entity?: RazorpaySubscriptionEntity;
    };
  };
};

const RAZORPAY_PAID_STATUSES = new Set(["active"]);

export async function createRazorpayCheckoutSubscription(
  input: RazorpayCheckoutInput,
  deps: RazorpayDeps = {},
): Promise<RazorpayCheckoutPayload> {
  const keyId = requireEnv("RAZORPAY_KEY_ID");
  const subscription = await createRazorpaySubscription(input, deps.fetchRazorpay);
  const subscriptionId = getString(subscription.id);

  if (!subscriptionId) {
    throw new ApiError(
      "INTERNAL_ERROR",
      "Razorpay did not return a subscription ID.",
    );
  }

  const client = getWebhookClient(deps.client);
  const razorpayStatus = getString(subscription.status) ?? "created";
  const status = normalizeRazorpayStatus(razorpayStatus);
  const customerId = getString(subscription.customer_id);

  await upsertSubscription(client, {
    cancel_at_period_end: false,
    current_period_end: timestampToIso(subscription.current_end ?? null),
    payment_provider: "razorpay",
    plan_tier: input.planTier,
    razorpay_customer_id: customerId,
    razorpay_payment_id: null,
    razorpay_subscription_id: subscriptionId,
    status,
    stripe_customer_id: legacyBillingCustomerPlaceholder(
      customerId ?? subscriptionId,
    ),
    stripe_subscription_id: legacyBillingSubscriptionPlaceholder(subscriptionId),
    user_id: input.userId,
  });
  await recordBillingAudit(client, {
    actorId: input.userId,
    eventType: "billing.razorpay.checkout.created",
    metadata: {
      paymentProvider: "razorpay",
      planTier: input.planTier,
      razorpayCustomerId: customerId,
      razorpayStatus,
      razorpaySubscriptionId: subscriptionId,
      status,
    },
  });

  return {
    description: `${titleCase(input.planTier)} subscription`,
    keyId,
    name: "MotionCode",
    prefill: input.email ? { email: input.email } : {},
    subscriptionId,
  };
}

export async function verifyRazorpayCheckoutPayment(
  input: RazorpayCheckoutVerificationInput,
  deps: RazorpayDeps = {},
) {
  const client = getWebhookClient(deps.client);
  const existing = await findSubscriptionByRazorpayId(
    client,
    input.subscriptionId,
  );
  const trustedSubscriptionId = stringField(existing, "razorpay_subscription_id");
  const trustedUserId = stringField(existing, "user_id");

  if (!trustedSubscriptionId || trustedUserId !== input.userId) {
    throw new ApiError("INVALID_REQUEST", "Unknown Razorpay subscription.");
  }

  if (
    !verifyRazorpayCheckoutSignature({
      paymentId: input.paymentId,
      secret: requireEnv("RAZORPAY_KEY_SECRET"),
      signature: input.signature,
      subscriptionId: trustedSubscriptionId,
    })
  ) {
    throw new ApiError("INVALID_REQUEST", "Invalid Razorpay payment signature.");
  }

  const subscription = await (deps.retrieveSubscription ??
    retrieveRazorpaySubscription)(trustedSubscriptionId);

  return syncRazorpaySubscription(subscription, deps, {
    eventId: null,
    eventType: "billing.razorpay.checkout.verified",
    fallbackPlanTier: isPlanTier(existing?.plan_tier)
      ? existing.plan_tier
      : undefined,
    paymentId: input.paymentId,
    userId: trustedUserId,
  });
}

export async function handleRazorpayWebhookRequest(
  request: Request,
  deps: RazorpayWebhookDeps = {},
) {
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    await observeBillingWebhook({
      outcome: "rejected",
      reason: "missing_signature",
    });

    return apiError("INVALID_REQUEST", "Missing Razorpay signature.");
  }

  const rawBody = await request.text();
  const isValid = (deps.verifyWebhookSignature ?? verifyRazorpayWebhookSignature)(
    rawBody,
    signature,
    requireEnv("RAZORPAY_WEBHOOK_SECRET"),
  );

  if (!isValid) {
    await observeBillingWebhook({
      outcome: "rejected",
      reason: "invalid_signature",
    });

    return apiError("INVALID_REQUEST", "Invalid Razorpay signature.");
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return apiError("INVALID_REQUEST", "Invalid Razorpay webhook payload.");
  }

  const eventId = request.headers.get("x-razorpay-event-id");
  try {
    if (deps.syncEvent) {
      await deps.syncEvent(event, { eventId });
    } else {
      await syncRazorpayWebhookEvent(event, { eventId }, deps);
    }
  } catch (error) {
    await observeBillingWebhook({
      outcome: "failed",
      reason: error instanceof ApiError ? error.code : "sync_failed",
      paymentEventType: event.event,
      userId: razorpayEventUserId(event),
    });

    if (error instanceof ApiError) {
      return apiError(error.code, error.message, { status: error.status });
    }

    return apiError("INTERNAL_ERROR", "Failed to process Razorpay webhook.");
  }

  await observeBillingWebhook({
    eventId,
    outcome: "processed",
    paymentEventType: event.event,
    userId: razorpayEventUserId(event),
  });

  return apiSuccess({ received: true as const });
}

export async function syncRazorpayWebhookEvent(
  event: RazorpayWebhookEvent,
  options: { eventId?: string | null } = {},
  deps: RazorpayDeps = {},
) {
  const subscription = event.payload?.subscription?.entity;
  if (!subscription) {
    return;
  }

  await syncRazorpaySubscription(subscription, deps, {
    eventId: options.eventId ?? null,
    eventType: `billing.razorpay.${event.event ?? "subscription.updated"}`,
    paymentId: null,
  });
}

async function createRazorpaySubscription(
  input: RazorpayCheckoutInput,
  fetchRazorpay: typeof fetch = fetch,
) {
  const planId = getRazorpayPlanId(input.planTier);
  const response = await fetchRazorpay(
    "https://api.razorpay.com/v1/subscriptions",
    {
      body: JSON.stringify({
        customer_notify: true,
        notes: {
          planTier: input.planTier,
          userId: input.userId,
        },
        plan_id: planId,
        quantity: 1,
        total_count: getRazorpaySubscriptionTotalCount(),
      }),
      headers: {
        Authorization: getRazorpayAuthorizationHeader(),
        "content-type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new ApiError(
      "INTERNAL_ERROR",
      await readRazorpayError(response, "Unable to create Razorpay subscription."),
    );
  }

  return (await response.json()) as RazorpaySubscriptionEntity;
}

async function retrieveRazorpaySubscription(subscriptionId: string) {
  const response = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(
      subscriptionId,
    )}`,
    {
      headers: {
        Authorization: getRazorpayAuthorizationHeader(),
      },
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new ApiError("INTERNAL_ERROR", "Unable to fetch Razorpay subscription.");
  }

  return (await response.json()) as RazorpaySubscriptionEntity;
}

async function syncRazorpaySubscription(
  subscription: RazorpaySubscriptionEntity,
  deps: RazorpayDeps,
  options: {
    eventId?: string | null;
    eventType: string;
    fallbackPlanTier?: PlanTier;
    paymentId?: string | null;
    userId?: string;
  },
) {
  const client = getWebhookClient(deps.client);
  const subscriptionId = getString(subscription.id);
  if (!subscriptionId) {
    throw new ApiError("INVALID_REQUEST", "Razorpay subscription is missing ID.");
  }

  const existing = options.userId
    ? null
    : await findSubscriptionByRazorpayId(client, subscriptionId);
  const userId =
    options.userId ??
    notesString(subscription, "userId") ??
    stringField(existing, "user_id");
  const customerId = getString(subscription.customer_id);
  const razorpayStatus = getString(subscription.status) ?? "created";
  const status = normalizeRazorpayStatus(razorpayStatus);

  if (!userId) {
    throw new ApiError(
      "INVALID_REQUEST",
      "Razorpay subscription is missing user identity.",
    );
  }

  const planTier =
    notesPlanTier(subscription) ??
    planIdPlanTier(subscription.plan_id) ??
    options.fallbackPlanTier ??
    (isPlanTier(existing?.plan_tier) ? existing.plan_tier : "free");
  const trustedPlanTier = RAZORPAY_PAID_STATUSES.has(razorpayStatus)
    && isPaidCheckoutEnabled()
    ? planTier
    : "free";

  await upsertSubscription(client, {
    cancel_at_period_end: isEndedRazorpayStatus(status),
    current_period_end: timestampToIso(subscription.current_end ?? null),
    payment_provider: "razorpay",
    plan_tier: planTier,
    razorpay_customer_id: customerId,
    razorpay_payment_id: options.paymentId ?? null,
    razorpay_subscription_id: subscriptionId,
    status,
    stripe_customer_id: legacyBillingCustomerPlaceholder(
      customerId ?? subscriptionId,
    ),
    stripe_subscription_id: legacyBillingSubscriptionPlaceholder(subscriptionId),
    user_id: userId,
  });
  await updateProfileBilling(client, userId, {
    plan_tier: trustedPlanTier,
    razorpay_customer_id: customerId,
  });
  await recordBillingAudit(client, {
    actorId: userId,
    eventType: options.eventType,
    metadata: {
      paymentProvider: "razorpay",
      planTier,
      profilePlanTier: trustedPlanTier,
      razorpayCustomerId: customerId,
      razorpayEventId: options.eventId,
      razorpayPaymentId: options.paymentId,
      razorpayStatus,
      razorpaySubscriptionId: subscriptionId,
      status,
    },
  });

  return { planTier: trustedPlanTier, status };
}

function getWebhookClient(client?: RazorpayWebhookSupabaseClient) {
  return (
    client ??
    (createTrustedSupabaseServerClient() as unknown as RazorpayWebhookSupabaseClient)
  );
}

async function findSubscriptionByRazorpayId(
  client: RazorpayWebhookSupabaseClient,
  subscriptionId: string,
) {
  const result = await client
    .from("subscriptions")
    .select("user_id,plan_tier,razorpay_customer_id,razorpay_subscription_id")
    .eq("razorpay_subscription_id", subscriptionId)
    .limit(1);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read subscription.");
  }

  return result.data?.[0] ?? null;
}

async function upsertSubscription(
  client: RazorpayWebhookSupabaseClient,
  values: Record<string, unknown>,
) {
  const result = await client.from("subscriptions").upsert(values, {
    onConflict: "razorpay_subscription_id",
  });

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to sync subscription.");
  }
}

async function updateProfileBilling(
  client: RazorpayWebhookSupabaseClient,
  userId: string,
  values: { plan_tier: PlanTier; razorpay_customer_id: string | null },
) {
  const result = await client.from("profiles").update(values).eq("id", userId);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to sync profile billing.");
  }
}

async function recordBillingAudit(
  client: RazorpayWebhookSupabaseClient,
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

function verifyRazorpayCheckoutSignature({
  paymentId,
  secret,
  signature,
  subscriptionId,
}: {
  paymentId: string;
  secret: string;
  signature: string;
  subscriptionId: string;
}) {
  return verifySignature(`${paymentId}|${subscriptionId}`, signature, secret);
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
) {
  return verifySignature(rawBody, signature, secret);
}

function verifySignature(message: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(message).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function getRazorpayPlanId(planTier: Exclude<PlanTier, "free">) {
  if (planTier === "pro") {
    return requireEnv("RAZORPAY_PRO_PLAN_ID");
  }

  return requireEnv("RAZORPAY_STUDIO_PLAN_ID");
}

function planIdPlanTier(planId: string | null | undefined): PlanTier | null {
  if (!planId) {
    return null;
  }

  if (planId === process.env.RAZORPAY_PRO_PLAN_ID) {
    return "pro";
  }

  if (planId === process.env.RAZORPAY_STUDIO_PLAN_ID) {
    return "studio";
  }

  return null;
}

function getRazorpaySubscriptionTotalCount() {
  const rawValue = requireEnv("RAZORPAY_SUBSCRIPTION_TOTAL_COUNT");
  const value = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("RAZORPAY_SUBSCRIPTION_TOTAL_COUNT must be a positive integer.");
  }

  return value;
}

function getRazorpayAuthorizationHeader() {
  const token = Buffer.from(
    `${requireEnv("RAZORPAY_KEY_ID")}:${requireEnv("RAZORPAY_KEY_SECRET")}`,
  ).toString("base64");

  return `Basic ${token}`;
}

async function readRazorpayError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as {
      error?: { description?: unknown };
    };
    const description = body.error?.description;
    return typeof description === "string" && description.length > 0
      ? description
      : fallback;
  } catch {
    return fallback;
  }
}

function notesPlanTier(subscription: RazorpaySubscriptionEntity) {
  const value = notesString(subscription, "planTier");
  return isPlanTier(value) ? value : null;
}

function notesString(subscription: RazorpaySubscriptionEntity, key: string) {
  const notes = subscription.notes;
  if (!notes || Array.isArray(notes) || typeof notes !== "object") {
    return null;
  }

  return getString((notes as Record<string, unknown>)[key]);
}

function razorpayEventUserId(event: RazorpayWebhookEvent) {
  const subscription = event.payload?.subscription?.entity;
  return subscription ? notesString(subscription, "userId") : null;
}

function isEndedRazorpayStatus(status: string) {
  return ["cancelled", "completed", "expired", "halted"].includes(status);
}

function normalizeRazorpayStatus(status: string) {
  if (RAZORPAY_PAID_STATUSES.has(status)) {
    return "active";
  }

  if (["cancelled", "completed", "expired"].includes(status)) {
    return "canceled";
  }

  if (status === "halted") {
    return "paused";
  }

  return "incomplete";
}

function legacyBillingCustomerPlaceholder(id: string) {
  return `razorpay_customer:${id}`;
}

function legacyBillingSubscriptionPlaceholder(subscriptionId: string) {
  return `razorpay_subscription:${subscriptionId}`;
}

function isPlanTier(value: unknown): value is PlanTier {
  return PLAN_TIERS.includes(value as PlanTier);
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

function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function requireEnv(key: string) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}`);
  }

  return value;
}
