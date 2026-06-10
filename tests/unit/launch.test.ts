import { afterEach, describe, expect, it, vi } from "vitest";

import {
  canTrustPaidBillingEntitlements,
  getLaunchPhase,
  isBetaInternalTestingEnabled,
  isOpenAiAnalysisEnabled,
  isPaidCheckoutEnabled,
  isRazorpayTestCheckoutEnabled,
} from "@/lib/contracts/launch";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
  vi.restoreAllMocks();
  vi.doUnmock("@/lib/supabase/server");
});

describe("launch feature gates", () => {
  it("defaults to beta with paid systems disabled", () => {
    expect(getLaunchPhase({})).toBe("beta");
    expect(isBetaInternalTestingEnabled({})).toBe(true);
    expect(isPaidCheckoutEnabled({})).toBe(false);
    expect(isRazorpayTestCheckoutEnabled({})).toBe(false);
    expect(canTrustPaidBillingEntitlements({})).toBe(false);
    expect(isOpenAiAnalysisEnabled({})).toBe(false);
  });

  it("enables paid checkout and OpenAI only in paid phase with explicit switches", () => {
    const env = {
      MOTIONCODE_ENABLE_OPENAI_ANALYSIS: "true",
      MOTIONCODE_ENABLE_PAID_CHECKOUT: "true",
      MOTIONCODE_LAUNCH_PHASE: "paid",
    };

    expect(getLaunchPhase(env)).toBe("paid");
    expect(isPaidCheckoutEnabled(env)).toBe(true);
    expect(canTrustPaidBillingEntitlements(env)).toBe(true);
    expect(isOpenAiAnalysisEnabled(env)).toBe(true);
  });

  it("keeps paid systems disabled when switches are true but phase is beta", () => {
    const env = {
      MOTIONCODE_ENABLE_OPENAI_ANALYSIS: "true",
      MOTIONCODE_ENABLE_PAID_CHECKOUT: "true",
      MOTIONCODE_LAUNCH_PHASE: "beta",
    };

    expect(isPaidCheckoutEnabled(env)).toBe(false);
    expect(canTrustPaidBillingEntitlements(env)).toBe(false);
    expect(isOpenAiAnalysisEnabled(env)).toBe(false);
  });

  it("allows explicit Razorpay test checkout without trusting paid entitlements", () => {
    const env = {
      MOTIONCODE_ENABLE_PAID_CHECKOUT: "true",
      MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT: "true",
      MOTIONCODE_LAUNCH_PHASE: "beta",
    };

    expect(isPaidCheckoutEnabled(env)).toBe(true);
    expect(isRazorpayTestCheckoutEnabled(env)).toBe(true);
    expect(canTrustPaidBillingEntitlements(env)).toBe(false);
  });

  it("rejects Razorpay checkout while paid checkout is disabled", async () => {
    process.env.MOTIONCODE_LAUNCH_PHASE = "beta";
    process.env.MOTIONCODE_ENABLE_PAID_CHECKOUT = "true";
    const getCurrentUser = vi.fn(async () => {
      throw new Error("auth should not run while checkout is disabled");
    });
    vi.doMock("@/lib/supabase/server", () => ({ getCurrentUser }));

    const { POST } = await import("@/app/api/razorpay/checkout/route");
    const response = await POST(
      new Request("https://motioncode.test/api/razorpay/checkout", {
        body: JSON.stringify({ planTier: "pro" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toMatchObject({
      code: "FORBIDDEN",
      ok: false,
    });
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it("allows Razorpay test checkout to reach authentication during beta", async () => {
    process.env.MOTIONCODE_LAUNCH_PHASE = "beta";
    process.env.MOTIONCODE_ENABLE_PAID_CHECKOUT = "true";
    process.env.MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT = "true";
    const getCurrentUser = vi.fn(async () => null);
    vi.doMock("@/lib/supabase/server", () => ({ getCurrentUser }));

    const { POST } = await import("@/app/api/razorpay/checkout/route");
    const response = await POST(
      new Request("https://motioncode.test/api/razorpay/checkout", {
        body: JSON.stringify({ planTier: "pro" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toMatchObject({
      code: "UNAUTHENTICATED",
      ok: false,
    });
    expect(getCurrentUser).toHaveBeenCalled();
  });
});
