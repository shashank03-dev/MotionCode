import { createHmac } from "node:crypto";

import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { RazorpayWebhookSupabaseClient } from "@/lib/server/razorpay";
import {
  createRazorpayCheckoutSubscription,
  handleRazorpayWebhookRequest,
  verifyRazorpayCheckoutPayment,
} from "@/lib/server/razorpay";

const ORIGINAL_ENV = { ...process.env };

type Operation = {
  table: string;
  type: "insert" | "select" | "update" | "upsert";
  values?: Record<string, unknown>;
  filters?: Record<string, unknown>;
};

function createRazorpayClient(
  rowsByTable: Record<string, Array<Record<string, unknown>>>,
) {
  const operations: Operation[] = [];
  const client = {
    from: vi.fn((table: string) => ({
      insert: vi.fn(async (values: Record<string, unknown>) => {
        operations.push({ table, type: "insert", values });
        return { error: null };
      }),
      select: vi.fn(() => {
        const filters: Record<string, unknown> = {};
        const filter = {
          eq: vi.fn((column: string, value: unknown) => {
            filters[column] = value;
            return filter;
          }),
          limit: vi.fn(async (count: number) => {
            const rows = (rowsByTable[table] ?? []).filter((row) =>
              Object.entries(filters).every(([key, value]) => row[key] === value),
            );
            operations.push({ filters, table, type: "select" });
            return { data: rows.slice(0, count), error: null };
          }),
          order: vi.fn(() => filter),
        };

        return filter;
      }),
      update: vi.fn((values: Record<string, unknown>) => {
        const filters: Record<string, unknown> = {};
        const filter = {
          eq: vi.fn(async (column: string, value: unknown) => {
            filters[column] = value;
            operations.push({ filters, table, type: "update", values });
            return { error: null };
          }),
        };

        return filter;
      }),
      upsert: vi.fn(async (values: Record<string, unknown>) => {
        operations.push({ table, type: "upsert", values });
        return { error: null };
      }),
    })),
  } satisfies RazorpayWebhookSupabaseClient;

  return { client, operations };
}

function sign(message: string, secret: string) {
  return createHmac("sha256", secret).update(message).digest("hex");
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
  vi.doUnmock("@/lib/supabase/server");
  vi.resetModules();
});

describe("Razorpay checkout creation", () => {
  it("creates a trusted Razorpay subscription and records pending billing state", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_key";
    process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
    process.env.RAZORPAY_PRO_PLAN_ID = "plan_pro";
    process.env.RAZORPAY_STUDIO_PLAN_ID = "plan_studio";
    process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT = "120";
    const { client, operations } = createRazorpayClient({});
    const fetchRazorpay = vi.fn(
      async (
        _url: Parameters<typeof fetch>[0],
        _init?: Parameters<typeof fetch>[1],
      ) => {
        void _url;
        void _init;

        return new Response(
          JSON.stringify({
            current_end: null,
            customer_id: null,
            id: "sub_123",
            status: "created",
          }),
          { status: 200 },
        );
      },
    );

    const checkout = await createRazorpayCheckoutSubscription(
      {
        email: "dev@example.com",
        planTier: "pro",
        userId: "user_123",
      },
      { client, fetchRazorpay },
    );

    expect(checkout).toEqual({
      description: "Pro subscription",
      keyId: "rzp_test_key",
      name: "MotionCode",
      prefill: { email: "dev@example.com" },
      subscriptionId: "sub_123",
    });
    expect(fetchRazorpay).toHaveBeenCalledWith(
      "https://api.razorpay.com/v1/subscriptions",
      expect.objectContaining({
        method: "POST",
      }),
    );
    const [, init] = fetchRazorpay.mock.calls[0] ?? [];
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      customer_notify: true,
      plan_id: "plan_pro",
      quantity: 1,
      total_count: 120,
    });
    expect(body.notes).toMatchObject({
      planTier: "pro",
      userId: "user_123",
    });
    expect(operations).toContainEqual(
      expect.objectContaining({
        table: "subscriptions",
        type: "upsert",
        values: expect.objectContaining({
          payment_provider: "razorpay",
          plan_tier: "pro",
          razorpay_subscription_id: "sub_123",
          status: "incomplete",
          stripe_customer_id: "razorpay_customer:sub_123",
          stripe_subscription_id: "razorpay_subscription:sub_123",
          user_id: "user_123",
        }),
      }),
    );
  });
});

describe("Razorpay checkout verification", () => {
  it("verifies the checkout signature against the trusted subscription and grants entitlements", async () => {
    process.env.MOTIONCODE_LAUNCH_PHASE = "paid";
    process.env.MOTIONCODE_ENABLE_PAID_CHECKOUT = "true";
    process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
    const { client, operations } = createRazorpayClient({
      subscriptions: [
        {
          payment_provider: "razorpay",
          plan_tier: "pro",
          razorpay_subscription_id: "sub_123",
          user_id: "user_123",
        },
      ],
    });
    const retrieveSubscription = vi.fn(async () => ({
      current_end: 1_780_000_000,
      customer_id: "cust_123",
      id: "sub_123",
      notes: { planTier: "pro", userId: "user_123" },
      status: "active",
    }));

    const result = await verifyRazorpayCheckoutPayment(
      {
        paymentId: "pay_123",
        signature: sign("pay_123|sub_123", "rzp_test_secret"),
        subscriptionId: "sub_123",
        userId: "user_123",
      },
      { client, retrieveSubscription },
    );

    expect(result).toEqual({ planTier: "pro", status: "active" });
    expect(retrieveSubscription).toHaveBeenCalledWith("sub_123");
    expect(operations).toContainEqual(
      expect.objectContaining({
        table: "profiles",
        type: "update",
        values: expect.objectContaining({
          plan_tier: "pro",
          razorpay_customer_id: "cust_123",
        }),
      }),
    );
    expect(operations).toContainEqual(
      expect.objectContaining({
        table: "audit_events",
        type: "insert",
        values: expect.objectContaining({
          actor_id: "user_123",
          event_type: "billing.razorpay.checkout.verified",
          metadata: expect.objectContaining({
            razorpayPaymentId: "pay_123",
          }),
        }),
      }),
    );
  });

  it("rejects invalid checkout signatures without syncing billing state", async () => {
    process.env.RAZORPAY_KEY_SECRET = "rzp_test_secret";
    const { client, operations } = createRazorpayClient({
      subscriptions: [
        {
          payment_provider: "razorpay",
          plan_tier: "pro",
          razorpay_subscription_id: "sub_123",
          user_id: "user_123",
        },
      ],
    });

    await expect(
      verifyRazorpayCheckoutPayment(
        {
          paymentId: "pay_123",
          signature: "bad_signature",
          subscriptionId: "sub_123",
          userId: "user_123",
        },
        { client },
      ),
    ).rejects.toMatchObject({ code: "INVALID_REQUEST" });

    expect(operations.map((operation) => operation.type)).not.toContain("update");
    expect(operations.map((operation) => operation.type)).not.toContain("upsert");
  });
});

describe("Razorpay webhook route handler", () => {
  it("verifies signed subscription webhooks before syncing trusted plan state", async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_razorpay";
    const { client, operations } = createRazorpayClient({});
    const rawBody = JSON.stringify({
      event: "subscription.cancelled",
      payload: {
        subscription: {
          entity: {
            current_end: 1_780_000_000,
            customer_id: "cust_123",
            id: "sub_123",
            notes: { planTier: "pro", userId: "user_123" },
            status: "cancelled",
          },
        },
      },
    });
    const request = new Request("https://motioncode.test/api/razorpay/webhook", {
      body: rawBody,
      headers: {
        "x-razorpay-event-id": "evt_razorpay_123",
        "x-razorpay-signature": sign(rawBody, "whsec_razorpay"),
      },
      method: "POST",
    });

    const response = await handleRazorpayWebhookRequest(request, { client });
    const json = (await response.json()) as ApiResponse<{ received: true }>;

    expect(response.status).toBe(200);
    expect(json).toEqual({ data: { received: true }, ok: true });
    expect(operations).toContainEqual(
      expect.objectContaining({
        table: "profiles",
        type: "update",
        values: expect.objectContaining({
          plan_tier: "free",
          razorpay_customer_id: "cust_123",
        }),
      }),
    );
    expect(operations).toContainEqual(
      expect.objectContaining({
        table: "audit_events",
        type: "insert",
        values: expect.objectContaining({
          actor_id: "user_123",
          event_type: "billing.razorpay.subscription.cancelled",
          metadata: expect.objectContaining({
            razorpayEventId: "evt_razorpay_123",
            razorpayStatus: "cancelled",
            status: "canceled",
          }),
        }),
      }),
    );
  });

  it("does not grant paid entitlements from active webhooks during beta", async () => {
    process.env.MOTIONCODE_LAUNCH_PHASE = "beta";
    process.env.MOTIONCODE_ENABLE_PAID_CHECKOUT = "true";
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_razorpay";
    const { client, operations } = createRazorpayClient({});
    const rawBody = JSON.stringify({
      event: "subscription.activated",
      payload: {
        subscription: {
          entity: {
            current_end: 1_780_000_000,
            customer_id: "cust_123",
            id: "sub_123",
            notes: { planTier: "pro", userId: "user_123" },
            status: "active",
          },
        },
      },
    });
    const request = new Request("https://motioncode.test/api/razorpay/webhook", {
      body: rawBody,
      headers: {
        "x-razorpay-event-id": "evt_razorpay_active",
        "x-razorpay-signature": sign(rawBody, "whsec_razorpay"),
      },
      method: "POST",
    });

    const response = await handleRazorpayWebhookRequest(request, { client });
    const json = (await response.json()) as ApiResponse<{ received: true }>;

    expect(response.status).toBe(200);
    expect(json).toEqual({ data: { received: true }, ok: true });
    expect(operations).toContainEqual(
      expect.objectContaining({
        table: "profiles",
        type: "update",
        values: expect.objectContaining({
          plan_tier: "free",
          razorpay_customer_id: "cust_123",
        }),
      }),
    );
    expect(operations).toContainEqual(
      expect.objectContaining({
        table: "audit_events",
        type: "insert",
        values: expect.objectContaining({
          actor_id: "user_123",
          event_type: "billing.razorpay.subscription.activated",
          metadata: expect.objectContaining({
            planTier: "pro",
            profilePlanTier: "free",
            razorpayEventId: "evt_razorpay_active",
            razorpayStatus: "active",
            status: "active",
          }),
        }),
      }),
    );
  });

  it("rejects invalid webhook signatures without syncing", async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_razorpay";
    const { client, operations } = createRazorpayClient({});
    const request = new Request("https://motioncode.test/api/razorpay/webhook", {
      body: "{}",
      headers: {
        "x-razorpay-signature": "bad_signature",
      },
      method: "POST",
    });

    const response = await handleRazorpayWebhookRequest(request, { client });

    expect(response.status).toBe(400);
    expect(operations).toEqual([]);
  });
});

describe("Razorpay verification API route", () => {
  it("rejects checkout verification during beta before reading auth state", async () => {
    process.env.MOTIONCODE_LAUNCH_PHASE = "beta";
    process.env.MOTIONCODE_ENABLE_PAID_CHECKOUT = "true";
    const getCurrentUser = vi.fn(async () => {
      throw new Error("auth should not run while paid checkout is disabled");
    });
    vi.doMock("@/lib/supabase/server", () => ({ getCurrentUser }));
    const { POST } = await import("@/app/api/razorpay/verify/route");

    const response = await POST(
      new Request("https://motioncode.test/api/razorpay/verify", {
        body: JSON.stringify({
          razorpay_payment_id: "pay_123",
          razorpay_signature: "signature",
          razorpay_subscription_id: "sub_123",
        }),
        method: "POST",
      }),
    );
    const json = (await response.json()) as ApiResponse<never>;

    expect(response.status).toBe(403);
    expect(json).toMatchObject({
      code: "FORBIDDEN",
      message: "Paid checkout is disabled during beta.",
      ok: false,
    });
    expect(getCurrentUser).not.toHaveBeenCalled();
  });
});
