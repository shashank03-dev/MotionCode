import { afterEach, describe, expect, it, vi } from "vitest";

import { PLAN_ENTITLEMENTS } from "@/lib/contracts/plans";
import type { EntitlementsSupabaseClient } from "@/lib/server/entitlements";
import {
  getEntitlementSummary,
  resolvePlanTierForUser,
} from "@/lib/server/entitlements";

type Row = Record<string, unknown>;

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

function createEntitlementsClient(rowsByTable: Record<string, Row[]>) {
  return {
    from: vi.fn((table: string) => {
      const rows = rowsByTable[table] ?? [];

      return {
        select: vi.fn(() => createFilter(rows)),
      };
    }),
  } satisfies EntitlementsSupabaseClient;
}

function createFilter(rows: Row[]) {
  const filters: Array<(row: Row) => boolean> = [];
  let orderedRows = rows;

  const applyFilters = () => orderedRows.filter((row) => filters.every((fn) => fn(row)));
  const filter = {
    eq: vi.fn((column: string, value: unknown) => {
      filters.push((row) => row[column] === value);
      return filter;
    }),
    gte: vi.fn(async (column: string, value: unknown) => ({
      count: applyFilters().filter((row) => {
        const field = row[column];
        return typeof field === "string" && typeof value === "string"
          ? field >= value
          : false;
      }).length,
      error: null,
    })),
    limit: vi.fn(async (count: number) => ({
      data: applyFilters().slice(0, count),
      error: null,
    })),
    order: vi.fn((column: string, options?: { ascending?: boolean }) => {
      orderedRows = [...orderedRows].sort((a, b) => {
        const left = String(a[column] ?? "");
        const right = String(b[column] ?? "");
        return options?.ascending === true
          ? left.localeCompare(right)
          : right.localeCompare(left);
      });
      return filter;
    }),
  };

  return filter;
}

function enablePaidCheckout() {
  process.env.MOTIONCODE_LAUNCH_PHASE = "paid";
  process.env.MOTIONCODE_ENABLE_PAID_CHECKOUT = "true";
}

describe("entitlement resolution", () => {
  it("uses an active admin override ahead of subscription and profile tiers", async () => {
    const client = createEntitlementsClient({
      admin_plan_overrides: [
        {
          created_at: "2026-06-05T12:00:00.000Z",
          expires_at: "2026-06-07T12:00:00.000Z",
          plan_tier: "studio",
          user_id: "user_123",
        },
      ],
      profiles: [
        {
          email: "dev@example.com",
          id: "user_123",
          plan_tier: "free",
        },
      ],
      subscriptions: [
        {
          created_at: "2026-06-05T12:00:00.000Z",
          plan_tier: "pro",
          status: "active",
          user_id: "user_123",
        },
      ],
      usage_events: [],
    });

    const summary = await getEntitlementSummary("user_123", {
      client,
      now: new Date("2026-06-06T12:00:00.000Z"),
    });

    expect(summary.planTier).toBe("studio");
    expect(summary.source).toBe("admin_override");
    expect(summary.entitlements).toEqual(PLAN_ENTITLEMENTS.studio);
  });

  it("uses the latest active subscription when no active override exists", async () => {
    enablePaidCheckout();
    const client = createEntitlementsClient({
      admin_plan_overrides: [
        {
          created_at: "2026-06-05T12:00:00.000Z",
          expires_at: "2026-06-06T00:00:00.000Z",
          plan_tier: "studio",
          user_id: "user_123",
        },
      ],
      profiles: [{ id: "user_123", plan_tier: "free" }],
      subscriptions: [
        {
          created_at: "2026-06-06T11:00:00.000Z",
          payment_provider: "razorpay",
          plan_tier: "pro",
          razorpay_subscription_id: "sub_123",
          status: "active",
          user_id: "user_123",
        },
      ],
      usage_events: [
        {
          created_at: "2026-06-06T10:00:00.000Z",
          event_type: "analysis.started",
          user_id: "user_123",
        },
        {
          created_at: "2026-06-05T23:00:00.000Z",
          event_type: "analysis.started",
          user_id: "user_123",
        },
      ],
    });

    const summary = await getEntitlementSummary("user_123", {
      client,
      now: new Date("2026-06-06T12:00:00.000Z"),
    });

    expect(summary.planTier).toBe("pro");
    expect(summary.source).toBe("subscription");
    expect(summary.usage.dailyAnalyses.used).toBe(1);
    expect(summary.usage.dailyAnalyses.limit).toBe(
      PLAN_ENTITLEMENTS.pro.dailyAnalyses,
    );
  });

  it("keeps access from an older active subscription when a newer checkout is incomplete", async () => {
    enablePaidCheckout();
    const client = createEntitlementsClient({
      admin_plan_overrides: [],
      profiles: [{ id: "user_123", plan_tier: "free" }],
      subscriptions: [
        {
          created_at: "2026-06-06T12:00:00.000Z",
          payment_provider: "razorpay",
          plan_tier: "studio",
          razorpay_subscription_id: "sub_pending",
          status: "incomplete",
          user_id: "user_123",
        },
        {
          created_at: "2026-06-06T11:00:00.000Z",
          payment_provider: "razorpay",
          plan_tier: "pro",
          razorpay_subscription_id: "sub_active",
          status: "active",
          user_id: "user_123",
        },
      ],
      usage_events: [],
    });

    const summary = await getEntitlementSummary("user_123", {
      client,
      now: new Date("2026-06-06T12:30:00.000Z"),
    });

    expect(summary.planTier).toBe("pro");
    expect(summary.source).toBe("subscription");
    expect(summary.subscription?.razorpay_subscription_id).toBe("sub_active");
  });

  it("does not grant paid access without a Razorpay subscription id", async () => {
    const client = createEntitlementsClient({
      admin_plan_overrides: [],
      profiles: [{ id: "user_123", plan_tier: "free" }],
      subscriptions: [
        {
          created_at: "2026-06-06T11:00:00.000Z",
          payment_provider: "razorpay",
          plan_tier: "pro",
          status: "active",
          user_id: "user_123",
        },
      ],
      usage_events: [],
    });

    const summary = await getEntitlementSummary("user_123", {
      client,
      now: new Date("2026-06-06T12:00:00.000Z"),
    });

    expect(summary.planTier).toBe("free");
    expect(summary.source).toBe("default");
  });

  it("does not grant paid access from stale profile plan tiers", async () => {
    const client = createEntitlementsClient({
      admin_plan_overrides: [
        {
          created_at: "2026-06-05T12:00:00.000Z",
          expires_at: "2026-06-06T00:00:00.000Z",
          plan_tier: "studio",
          user_id: "user_123",
        },
      ],
      profiles: [{ id: "user_123", plan_tier: "studio" }],
      subscriptions: [],
      usage_events: [],
    });

    const summary = await getEntitlementSummary("user_123", {
      client,
      now: new Date("2026-06-06T12:00:00.000Z"),
    });

    expect(summary.planTier).toBe("free");
    expect(summary.source).toBe("default");
  });

  it("uses an active Razorpay subscription as a trusted paid entitlement", async () => {
    enablePaidCheckout();
    const client = createEntitlementsClient({
      admin_plan_overrides: [],
      profiles: [{ id: "user_123", plan_tier: "free" }],
      subscriptions: [
        {
          created_at: "2026-06-06T11:00:00.000Z",
          payment_provider: "razorpay",
          plan_tier: "pro",
          razorpay_subscription_id: "sub_123",
          status: "active",
          user_id: "user_123",
        },
      ],
      usage_events: [],
    });

    const summary = await getEntitlementSummary("user_123", {
      client,
      now: new Date("2026-06-06T12:00:00.000Z"),
    });

    expect(summary.planTier).toBe("pro");
    expect(summary.source).toBe("subscription");
    expect(summary.subscription?.payment_provider).toBe("razorpay");
  });

  it("does not grant paid access from active Razorpay subscriptions during beta", async () => {
    process.env.MOTIONCODE_LAUNCH_PHASE = "beta";
    process.env.MOTIONCODE_ENABLE_PAID_CHECKOUT = "true";
    const client = createEntitlementsClient({
      admin_plan_overrides: [],
      profiles: [{ id: "user_123", plan_tier: "free" }],
      subscriptions: [
        {
          created_at: "2026-06-06T11:00:00.000Z",
          payment_provider: "razorpay",
          plan_tier: "pro",
          razorpay_subscription_id: "sub_123",
          status: "active",
          user_id: "user_123",
        },
      ],
      usage_events: [],
    });

    const summary = await getEntitlementSummary("user_123", {
      client,
      now: new Date("2026-06-06T12:00:00.000Z"),
    });

    expect(summary.planTier).toBe("free");
    expect(summary.source).toBe("default");
  });

  it("does not grant paid access from Razorpay authorization before activation", async () => {
    const client = createEntitlementsClient({
      admin_plan_overrides: [],
      profiles: [{ id: "user_123", plan_tier: "free" }],
      subscriptions: [
        {
          created_at: "2026-06-06T11:00:00.000Z",
          payment_provider: "razorpay",
          plan_tier: "pro",
          razorpay_subscription_id: "sub_123",
          status: "authenticated",
          user_id: "user_123",
        },
      ],
      usage_events: [],
    });

    const summary = await getEntitlementSummary("user_123", {
      client,
      now: new Date("2026-06-06T12:00:00.000Z"),
    });

    expect(summary.planTier).toBe("free");
    expect(summary.source).toBe("default");
  });

  it("keeps the public free beta limit at one analysis per day", async () => {
    const client = createEntitlementsClient({
      admin_plan_overrides: [],
      profiles: [{ id: "user_123", is_internal_admin: false, plan_tier: "free" }],
      subscriptions: [],
      usage_events: [],
    });

    const summary = await getEntitlementSummary("user_123", {
      client,
      now: new Date("2026-06-06T12:00:00.000Z"),
    });

    expect(summary.planTier).toBe("free");
    expect(summary.entitlements.dailyAnalyses).toBe(1);
    expect(summary.usage.dailyAnalyses.limit).toBe(1);
  });

  it("keeps three daily analyses for profile-backed internal admins during beta", async () => {
    const client = createEntitlementsClient({
      admin_plan_overrides: [],
      profiles: [
        {
          email: "admin@example.com",
          id: "user_123",
          is_internal_admin: true,
          plan_tier: "free",
        },
      ],
      subscriptions: [],
      usage_events: [
        {
          created_at: "2026-06-06T10:00:00.000Z",
          event_type: "analysis.started",
          user_id: "user_123",
        },
        {
          created_at: "2026-06-06T11:00:00.000Z",
          event_type: "analysis.started",
          user_id: "user_123",
        },
      ],
    });

    const summary = await getEntitlementSummary("user_123", {
      client,
      now: new Date("2026-06-06T12:00:00.000Z"),
    });

    expect(summary.planTier).toBe("free");
    expect(summary.entitlements.dailyAnalyses).toBe(3);
    expect(summary.usage.dailyAnalyses).toEqual({
      limit: 3,
      remaining: 1,
      used: 2,
    });
  });

  it("keeps three daily analyses for allowlisted internal admins during beta", async () => {
    process.env.MOTIONCODE_INTERNAL_ADMIN_USER_IDS = "user_123";
    const client = createEntitlementsClient({
      admin_plan_overrides: [],
      profiles: [{ id: "user_123", is_internal_admin: false, plan_tier: "free" }],
      subscriptions: [],
      usage_events: [],
    });

    const summary = await getEntitlementSummary("user_123", {
      client,
      now: new Date("2026-06-06T12:00:00.000Z"),
    });

    expect(summary.planTier).toBe("free");
    expect(summary.entitlements.dailyAnalyses).toBe(3);
    expect(summary.source).toBe("profile");
  });

  it("does not trust client-controlled user metadata for plan tier", async () => {
    const client = createEntitlementsClient({
      admin_plan_overrides: [],
      profiles: [{ id: "user_123", plan_tier: "free" }],
      subscriptions: [],
      usage_events: [],
    });

    await expect(
      resolvePlanTierForUser(
        {
          app_metadata: { plan_tier: "studio" },
          id: "user_123",
        },
        { client, now: new Date("2026-06-06T12:00:00.000Z") },
      ),
    ).resolves.toBe("free");
  });
});
