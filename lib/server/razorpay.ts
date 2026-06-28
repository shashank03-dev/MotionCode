import { createHmac, timingSafeEqual } from "node:crypto";

import { canTrustPaidBillingEntitlements } from "@/lib/contracts/launch";
import { PLAN_TIERS, type PlanTier } from "@/lib/contracts/plans";

import { apiError, apiSuccess, ApiError } from "./apiErrors";
import { createTrustedSupabaseServerClient } from "./audit";
import { getRazorpayBillingEnv } from "./env";
import { observeBillingWebhook } from "./observability";

type DbResult = {
  error: { code?: string; message?: string } | null;
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
    delete: () => {
      eq: (column: string, value: unknown) => PromiseLike<DbResult>;
    };
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
  cancelSubscription?: (
    subscriptionId: string,
  ) => Promise<RazorpaySubscriptionEntity>;
  client?: RazorpayWebhookSupabaseClient;
  fetchInvoices?: (subscriptionId: string) => Promise<RazorpayInvoiceEntity[]>;
  fetchRazorpay?: typeof fetch;
  retrieveSubscription?: (
    subscriptionId: string,
  ) => Promise<RazorpaySubscriptionEntity>;
  updateSubscription?: (
    subscriptionId: string,
    change: { planId: string; scheduleChangeAt: "cycle_end" | "now" },
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

type RazorpayInvoiceEntity = {
  amount?: number | null;
  created_at?: number | null;
  currency?: string | null;
  id?: string | null;
  issued_at?: number | null;
  short_url?: string | null;
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
  const billingEnv = getRazorpayBillingEnv();
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
    keyId: billingEnv.keyId,
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
      secret: getRazorpayBillingEnv().keySecret,
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

export type RazorpayCancelInput = {
  userId: string;
};

export type RazorpayChangePlanInput = {
  targetPlanTier: Exclude<PlanTier, "free">;
  userId: string;
};

export type RazorpayInvoiceSummary = {
  amount: number;
  currency: string;
  id: string;
  issuedAt: string | null;
  shortUrl: string | null;
  status: string;
};

const PLAN_RANK: Record<PlanTier, number> = {
  free: 0,
  pro: 1,
  studio: 2,
};

export async function cancelRazorpaySubscription(
  input: RazorpayCancelInput,
  deps: RazorpayDeps = {},
) {
  const client = getWebhookClient(deps.client);
  const subscription = await findActiveSubscriptionForUser(client, input.userId);
  const subscriptionId = stringField(subscription, "razorpay_subscription_id");

  if (!subscription || !subscriptionId) {
    throw new ApiError(
      "INVALID_REQUEST",
      "No active Razorpay subscription to cancel.",
    );
  }

  const entity = await (deps.cancelSubscription ?? cancelRazorpaySubscriptionApi)(
    subscriptionId,
  );
  const razorpayStatus = getString(entity.status) ?? "active";
  const status = normalizeRazorpayStatus(razorpayStatus);

  await updateSubscriptionByRazorpayId(client, subscriptionId, {
    cancel_at_period_end: true,
    current_period_end: timestampToIso(entity.current_end ?? null),
    status,
  });
  await recordBillingAudit(client, {
    actorId: input.userId,
    eventType: "billing.razorpay.subscription.cancel_requested",
    metadata: {
      cancelAtPeriodEnd: true,
      paymentProvider: "razorpay",
      planTier: isPlanTier(subscription.plan_tier) ? subscription.plan_tier : null,
      razorpayStatus,
      razorpaySubscriptionId: subscriptionId,
      status,
    },
  });

  return {
    cancelAtPeriodEnd: true as const,
    currentPeriodEnd: timestampToIso(entity.current_end ?? null),
    status,
  };
}

export async function changeRazorpaySubscriptionPlan(
  input: RazorpayChangePlanInput,
  deps: RazorpayDeps = {},
) {
  const billingEnv = getRazorpayBillingEnv();
  const client = getWebhookClient(deps.client);
  const subscription = await findActiveSubscriptionForUser(client, input.userId);
  const subscriptionId = stringField(subscription, "razorpay_subscription_id");

  if (!subscription || !subscriptionId) {
    throw new ApiError(
      "INVALID_REQUEST",
      "No active Razorpay subscription to change.",
    );
  }

  const currentPlanTier = isPlanTier(subscription.plan_tier)
    ? subscription.plan_tier
    : "free";
  if (currentPlanTier === input.targetPlanTier) {
    throw new ApiError(
      "INVALID_REQUEST",
      "Subscription is already on the selected plan.",
    );
  }

  const scheduleChangeAt =
    PLAN_RANK[input.targetPlanTier] > PLAN_RANK[currentPlanTier]
      ? "now"
      : "cycle_end";

  const entity = await (deps.updateSubscription ?? updateRazorpaySubscriptionApi)(
    subscriptionId,
    {
      planId: getRazorpayPlanId(input.targetPlanTier, billingEnv),
      scheduleChangeAt,
    },
  );

  const synced = await syncRazorpaySubscription(entity, deps, {
    eventId: null,
    eventType: "billing.razorpay.subscription.plan_changed",
    fallbackPlanTier:
      scheduleChangeAt === "now" ? input.targetPlanTier : undefined,
    paymentId: null,
    userId: input.userId,
  });

  return {
    effective: scheduleChangeAt,
    planTier: synced.planTier,
    requestedPlanTier: input.targetPlanTier,
    status: synced.status,
  };
}

export async function listRazorpaySubscriptionInvoices(
  subscriptionId: string,
  deps: RazorpayDeps = {},
): Promise<RazorpayInvoiceSummary[]> {
  const entities = await (deps.fetchInvoices ?? fetchRazorpayInvoicesApi)(
    subscriptionId,
  );

  return entities.map((invoice) => ({
    amount: typeof invoice.amount === "number" ? invoice.amount : 0,
    currency: getString(invoice.currency) ?? "INR",
    id: getString(invoice.id) ?? "",
    issuedAt: timestampToIso(invoice.issued_at ?? invoice.created_at ?? null),
    shortUrl: getString(invoice.short_url),
    status: getString(invoice.status) ?? "unknown",
  }));
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
    getRazorpayBillingEnv().webhookSecret,
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
  const client = getWebhookClient(deps.client);
  const eventClaim = eventId
    ? await claimBillingWebhookEvent(client, {
        eventId,
        eventType: event.event ?? null,
      })
    : "untracked";
  if (eventClaim === "processed") {
    await observeBillingWebhook({
      eventId,
      outcome: "processed",
      paymentEventType: event.event,
      reason: "duplicate_event",
      userId: razorpayEventUserId(event),
    });

    return apiSuccess({ duplicate: true as const, received: true as const });
  }
  if (eventClaim === "in_progress") {
    await observeBillingWebhook({
      eventId,
      outcome: "rejected",
      paymentEventType: event.event,
      reason: "event_already_processing",
      userId: razorpayEventUserId(event),
    });

    return apiError(
      "RATE_LIMITED",
      "Razorpay webhook event is already being processed.",
      { status: 409 },
    );
  }

  try {
    if (deps.syncEvent) {
      await deps.syncEvent(event, { eventId });
    } else {
      await syncRazorpayWebhookEvent(event, { eventId }, deps);
    }
    if (eventClaim === "claimed" && eventId) {
      await markBillingWebhookEventProcessed(client, {
        eventId,
        eventType: event.event ?? null,
      });
    }
  } catch (error) {
    await observeBillingWebhook({
      outcome: "failed",
      reason: error instanceof ApiError ? error.code : "sync_failed",
      paymentEventType: event.event,
      userId: razorpayEventUserId(event),
    });

    if (eventClaim === "claimed" && eventId) {
      await releaseBillingWebhookEventClaim(client, eventId);
    }

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
  const billingEnv = getRazorpayBillingEnv();
  const planId = getRazorpayPlanId(input.planTier, billingEnv);
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
        total_count: billingEnv.subscriptionTotalCount,
      }),
      headers: {
        Authorization: getRazorpayAuthorizationHeader(billingEnv),
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
  const billingEnv = getRazorpayBillingEnv();
  const response = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(
      subscriptionId,
    )}`,
    {
      headers: {
        Authorization: getRazorpayAuthorizationHeader(billingEnv),
      },
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new ApiError("INTERNAL_ERROR", "Unable to fetch Razorpay subscription.");
  }

  return (await response.json()) as RazorpaySubscriptionEntity;
}

async function cancelRazorpaySubscriptionApi(subscriptionId: string) {
  const billingEnv = getRazorpayBillingEnv();
  const response = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(
      subscriptionId,
    )}/cancel`,
    {
      body: JSON.stringify({ cancel_at_cycle_end: true }),
      headers: {
        Authorization: getRazorpayAuthorizationHeader(billingEnv),
        "content-type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new ApiError(
      "INTERNAL_ERROR",
      await readRazorpayError(response, "Unable to cancel Razorpay subscription."),
    );
  }

  return (await response.json()) as RazorpaySubscriptionEntity;
}

async function updateRazorpaySubscriptionApi(
  subscriptionId: string,
  change: { planId: string; scheduleChangeAt: "cycle_end" | "now" },
) {
  const billingEnv = getRazorpayBillingEnv();
  const response = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${encodeURIComponent(
      subscriptionId,
    )}`,
    {
      body: JSON.stringify({
        customer_notify: true,
        plan_id: change.planId,
        quantity: 1,
        schedule_change_at: change.scheduleChangeAt,
      }),
      headers: {
        Authorization: getRazorpayAuthorizationHeader(billingEnv),
        "content-type": "application/json",
      },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    throw new ApiError(
      "INTERNAL_ERROR",
      await readRazorpayError(response, "Unable to update Razorpay subscription."),
    );
  }

  return (await response.json()) as RazorpaySubscriptionEntity;
}

async function fetchRazorpayInvoicesApi(subscriptionId: string) {
  const billingEnv = getRazorpayBillingEnv();
  const response = await fetch(
    `https://api.razorpay.com/v1/invoices?subscription_id=${encodeURIComponent(
      subscriptionId,
    )}`,
    {
      headers: {
        Authorization: getRazorpayAuthorizationHeader(billingEnv),
      },
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new ApiError("INTERNAL_ERROR", "Unable to fetch Razorpay invoices.");
  }

  const body = (await response.json()) as { items?: RazorpayInvoiceEntity[] };
  return body.items ?? [];
}

async function findActiveSubscriptionForUser(
  client: RazorpayWebhookSupabaseClient,
  userId: string,
) {
  const result = await client
    .from("subscriptions")
    .select(
      "user_id,plan_tier,status,cancel_at_period_end,current_period_end,razorpay_customer_id,razorpay_subscription_id",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read subscription.");
  }

  const rows = result.data ?? [];
  return (
    rows.find(
      (row) =>
        typeof row.razorpay_subscription_id === "string" &&
        row.razorpay_subscription_id.length > 0 &&
        isManageableRazorpayStatus(row.status),
    ) ?? null
  );
}

function isManageableRazorpayStatus(status: unknown) {
  return (
    typeof status === "string" &&
    ["active", "authenticated", "past_due", "trialing"].includes(status)
  );
}

async function updateSubscriptionByRazorpayId(
  client: RazorpayWebhookSupabaseClient,
  subscriptionId: string,
  values: Record<string, unknown>,
) {
  const result = await client
    .from("subscriptions")
    .update(values)
    .eq("razorpay_subscription_id", subscriptionId);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to update subscription.");
  }
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

  const existingPlanTier = isPlanTier(existing?.plan_tier)
    ? existing.plan_tier
    : null;
  const trustedBillingPlanTier =
    planIdPlanTier(subscription.plan_id) ??
    options.fallbackPlanTier ??
    existingPlanTier;
  const notesOnlyPlanTier = notesPlanTier(subscription);
  const billingPlanTier = trustedBillingPlanTier ?? "free";
  const trustedPlanTier = RAZORPAY_PAID_STATUSES.has(razorpayStatus) &&
    canTrustPaidBillingEntitlements() &&
    trustedBillingPlanTier
    ? billingPlanTier
    : "free";

  await upsertSubscription(client, {
    cancel_at_period_end: isEndedRazorpayStatus(status),
    current_period_end: timestampToIso(subscription.current_end ?? null),
    payment_provider: "razorpay",
    plan_tier: trustedPlanTier,
    razorpay_customer_id: customerId,
    razorpay_payment_id: options.paymentId ?? null,
    razorpay_subscription_id: subscriptionId,
    status,
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
      billingPlanTier,
      notesPlanTier: notesOnlyPlanTier,
      planTier: trustedPlanTier,
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

async function claimBillingWebhookEvent(
  client: RazorpayWebhookSupabaseClient,
  event: { eventId: string; eventType: string | null },
): Promise<"claimed" | "in_progress" | "processed"> {
  const result = await client.from("billing_webhook_events").insert({
    event_id: event.eventId,
    event_type: event.eventType,
    processed_at: null,
    provider: "razorpay",
  });

  if (isUniqueViolation(result.error)) {
    const existing = await findBillingWebhookEvent(client, event.eventId);
    return stringField(existing, "processed_at") ? "processed" : "in_progress";
  }

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to claim billing webhook event.");
  }

  return "claimed";
}

async function findBillingWebhookEvent(
  client: RazorpayWebhookSupabaseClient,
  eventId: string,
) {
  const result = await client
    .from("billing_webhook_events")
    .select("event_id,processed_at")
    .eq("provider", "razorpay")
    .eq("event_id", eventId)
    .limit(1);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read billing webhook event.");
  }

  return result.data?.[0] ?? null;
}

async function markBillingWebhookEventProcessed(
  client: RazorpayWebhookSupabaseClient,
  event: { eventId: string; eventType: string | null },
) {
  const result = await client.from("billing_webhook_events").update({
    event_type: event.eventType,
    processed_at: new Date().toISOString(),
  }).eq("event_id", event.eventId);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to mark billing webhook event.");
  }
}

async function releaseBillingWebhookEventClaim(
  client: RazorpayWebhookSupabaseClient,
  eventId: string,
) {
  const result = await client
    .from("billing_webhook_events")
    .delete()
    .eq("event_id", eventId);

  if (result.error) {
    await observeBillingWebhook({
      eventId,
      outcome: "failed",
      reason: "release_claim_failed",
    });
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

function getRazorpayPlanId(
  planTier: Exclude<PlanTier, "free">,
  billingEnv = getRazorpayBillingEnv(),
) {
  if (planTier === "pro") {
    return billingEnv.proPlanId;
  }

  return billingEnv.studioPlanId;
}

function planIdPlanTier(planId: string | null | undefined): PlanTier | null {
  if (!planId) {
    return null;
  }

  const billingEnv = getRazorpayBillingEnv();
  if (planId === billingEnv.proPlanId) {
    return "pro";
  }

  if (planId === billingEnv.studioPlanId) {
    return "studio";
  }

  return null;
}

function getRazorpayAuthorizationHeader(
  billingEnv = getRazorpayBillingEnv(),
) {
  const token = Buffer.from(
    `${billingEnv.keyId}:${billingEnv.keySecret}`,
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

function isUniqueViolation(error: { message?: string } | null) {
  const code = (error as { code?: string } | null)?.code;
  return code === "23505" || /duplicate key/i.test(error?.message ?? "");
}
