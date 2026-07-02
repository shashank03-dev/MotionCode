import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.doUnmock("@/lib/supabase/server");
  vi.doUnmock("@/lib/server/entitlements");
  vi.doUnmock("@/lib/server/razorpay");
});

function mockUser() {
  vi.doMock("@/lib/supabase/server", () => ({
    getCurrentUser: vi.fn(async () => ({
      email: "granted@example.com",
      id: "user_granted",
    })),
  }));
}

function mockRazorpay() {
  vi.doMock("@/lib/server/razorpay", () => ({
    getRazorpaySubscriptionSchedule: vi.fn(async () => ({
      hasScheduledChanges: false,
    })),
    listRazorpaySubscriptionInvoices: vi.fn(async () => []),
  }));
}

async function renderBilling() {
  const { BillingContent } = await import(
    "@/components/billing/BillingContent"
  );
  return renderToStaticMarkup(await BillingContent());
}

describe("BillingContent admin-override (complimentary) state", () => {
  it("renders a complimentary Studio plan with real override dates and no free-plan copy", async () => {
    mockUser();
    mockRazorpay();
    vi.doMock("@/lib/server/entitlements", () => ({
      getEntitlementSummary: vi.fn(async () => ({
        entitlements: {},
        override: {
          created_at: "2026-06-01T00:00:00.000Z",
          expires_at: "2026-09-01T00:00:00.000Z",
          plan_tier: "studio",
          reason: "founder giveaway",
          user_id: "user_granted",
        },
        planTier: "studio",
        profile: null,
        source: "admin_override",
        subscription: null,
        usage: { dailyAnalyses: { limit: 500, remaining: 500, used: 0 } },
      })),
    }));

    const html = await renderBilling();

    // Plan reflects the override; status reads as a giveaway, not "Free".
    expect(html).toContain("Studio");
    expect(html).toContain("Complimentary");
    expect(html).toContain("Complimentary access");
    // Real override dates surface — no "No expiry" placeholder when set.
    expect(html).toContain("Access until");
    expect(html).toContain("Granted");
    expect(html).not.toContain("No expiry");
    // Plans link is kept.
    expect(html).toContain("View paid plans");
    // The misleading free-plan messaging must NOT appear for a granted user.
    expect(html).not.toContain("No active subscription");
    expect(html).not.toContain("You are on the free plan");
  });

  it("shows a no-expiry giveaway when the override never expires", async () => {
    mockUser();
    mockRazorpay();
    vi.doMock("@/lib/server/entitlements", () => ({
      getEntitlementSummary: vi.fn(async () => ({
        entitlements: {},
        override: {
          created_at: "2026-06-01T00:00:00.000Z",
          expires_at: null,
          plan_tier: "pro",
          reason: "beta thank-you",
          user_id: "user_granted",
        },
        planTier: "pro",
        profile: null,
        source: "admin_override",
        subscription: null,
        usage: { dailyAnalyses: { limit: 100, remaining: 100, used: 0 } },
      })),
    }));

    const html = await renderBilling();

    expect(html).toContain("Pro");
    expect(html).toContain("Complimentary");
    expect(html).toContain("No expiry");
    expect(html).toContain("with no expiry date");
    expect(html).not.toContain("No active subscription");
  });

  it("still shows the free-plan card for a genuine free user", async () => {
    mockUser();
    mockRazorpay();
    vi.doMock("@/lib/server/entitlements", () => ({
      getEntitlementSummary: vi.fn(async () => ({
        entitlements: {},
        override: null,
        planTier: "free",
        profile: null,
        source: "default",
        subscription: null,
        usage: { dailyAnalyses: { limit: 1, remaining: 1, used: 0 } },
      })),
    }));

    const html = await renderBilling();

    expect(html).toContain("No active subscription");
    expect(html).toContain("You are on the free plan");
    expect(html).not.toContain("Complimentary access");
  });
});
