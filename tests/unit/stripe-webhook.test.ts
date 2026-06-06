import type Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { StripeWebhookSupabaseClient } from "@/lib/server/stripe";
import {
  handleStripeWebhookRequest,
  syncStripeWebhookEvent,
} from "@/lib/server/stripe";

const ORIGINAL_ENV = { ...process.env };

type Operation = {
  table: string;
  type: "insert" | "select" | "update" | "upsert";
  values?: Record<string, unknown>;
  filters?: Record<string, unknown>;
};

function createStripeClient(rowsByTable: Record<string, Array<Record<string, unknown>>>) {
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
  } satisfies StripeWebhookSupabaseClient;

  return { client, operations };
}

function subscription(overrides: Partial<Stripe.Subscription> = {}) {
  return {
    cancel_at_period_end: false,
    current_period_end: 1_780_000_000,
    customer: "cus_123",
    id: "sub_123",
    items: {
      data: [
        {
          price: { id: "price_pro" },
        },
      ],
    },
    metadata: { planTier: "pro", userId: "user_123" },
    object: "subscription",
    status: "active",
    ...overrides,
  } as unknown as Stripe.Subscription;
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("Stripe webhook route handler", () => {
  it("verifies the raw payload with STRIPE_WEBHOOK_SECRET before syncing", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const event = {
      data: { object: { id: "cs_123" } },
      id: "evt_123",
      type: "checkout.session.completed",
    } as unknown as Stripe.Event;
    const constructEvent = vi.fn(() => event);
    const syncEvent = vi.fn(async () => undefined);
    const request = new Request("https://motioncode.test/api/stripe/webhook", {
      body: '{"id":"evt_123"}',
      headers: { "stripe-signature": "sig_123" },
      method: "POST",
    });

    const response = await handleStripeWebhookRequest(request, {
      constructEvent,
      syncEvent,
    });
    const json = (await response.json()) as ApiResponse<{ received: true }>;

    expect(response.status).toBe(200);
    expect(json).toEqual({ data: { received: true }, ok: true });
    expect(constructEvent).toHaveBeenCalledWith(
      '{"id":"evt_123"}',
      "sig_123",
      "whsec_test",
    );
    expect(syncEvent).toHaveBeenCalledWith(event);
  });

  it("rejects invalid webhook signatures without syncing", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const syncEvent = vi.fn(async () => undefined);
    const request = new Request("https://motioncode.test/api/stripe/webhook", {
      body: "{}",
      headers: { "stripe-signature": "bad_sig" },
      method: "POST",
    });

    const response = await handleStripeWebhookRequest(request, {
      constructEvent: vi.fn(() => {
        throw new Error("signature mismatch");
      }),
      syncEvent,
    });
    const json = (await response.json()) as ApiResponse<{ received: true }>;

    expect(response.status).toBe(400);
    expect(json).toMatchObject({ code: "INVALID_REQUEST", ok: false });
    expect(syncEvent).not.toHaveBeenCalled();
  });
});

describe("Stripe webhook syncing", () => {
  it("upserts checkout subscription state and updates the trusted profile plan", async () => {
    process.env.STRIPE_PRO_PRICE_ID = "price_pro";
    process.env.STRIPE_STUDIO_PRICE_ID = "price_studio";
    const { client, operations } = createStripeClient({});
    const retrieveSubscription = vi.fn(async () => subscription());
    const event = {
      data: {
        object: {
          client_reference_id: "user_123",
          customer: "cus_123",
          id: "cs_123",
          metadata: { planTier: "pro", userId: "user_123" },
          object: "checkout.session",
          subscription: "sub_123",
        },
      },
      id: "evt_checkout",
      type: "checkout.session.completed",
    } as unknown as Stripe.Event;

    await syncStripeWebhookEvent(event, { client, retrieveSubscription });

    expect(retrieveSubscription).toHaveBeenCalledWith("sub_123");
    expect(operations).toContainEqual(
      expect.objectContaining({
        table: "subscriptions",
        type: "upsert",
        values: expect.objectContaining({
          plan_tier: "pro",
          status: "active",
          stripe_customer_id: "cus_123",
          stripe_subscription_id: "sub_123",
          user_id: "user_123",
        }),
      }),
    );
    expect(operations).toContainEqual(
      expect.objectContaining({
        table: "profiles",
        type: "update",
        values: expect.objectContaining({
          plan_tier: "pro",
          stripe_customer_id: "cus_123",
        }),
      }),
    );
    expect(operations).toContainEqual(
      expect.objectContaining({
        table: "audit_events",
        type: "insert",
        values: expect.objectContaining({
          actor_id: "user_123",
          event_type: "billing.checkout.completed",
        }),
      }),
    );
  });

  it("downgrades entitlements on subscription deletion without deleting account data", async () => {
    process.env.STRIPE_PRO_PRICE_ID = "price_pro";
    process.env.STRIPE_STUDIO_PRICE_ID = "price_studio";
    const { client, operations } = createStripeClient({
      subscriptions: [
        {
          plan_tier: "pro",
          stripe_subscription_id: "sub_123",
          user_id: "user_123",
        },
      ],
    });
    const event = {
      data: {
        object: subscription({
          status: "canceled",
        }),
      },
      id: "evt_deleted",
      type: "customer.subscription.deleted",
    } as unknown as Stripe.Event;

    await syncStripeWebhookEvent(event, { client });

    expect(operations).toContainEqual(
      expect.objectContaining({
        table: "profiles",
        type: "update",
        values: expect.objectContaining({ plan_tier: "free" }),
      }),
    );
    expect(operations.some((operation) => operation.type === "select")).toBe(true);
    expect(operations.map((operation) => operation.type)).not.toContain("delete");
  });
});
