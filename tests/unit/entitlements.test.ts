import { describe, expect, it, vi } from "vitest";

import { PLAN_ENTITLEMENTS } from "@/lib/contracts/plans";
import type { EntitlementsSupabaseClient } from "@/lib/server/entitlements";
import {
  getEntitlementSummary,
  resolvePlanTierForUser,
} from "@/lib/server/entitlements";

type Row = Record<string, unknown>;

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
          stripe_customer_id: "cus_123",
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
          plan_tier: "pro",
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
