import { afterEach, describe, expect, it } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("server env loader", () => {
  it("returns the server-only env values needed by API routes", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://motioncode.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    process.env.GEMINI_API_KEY = "server-gemini-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-placeholder";

    const { getServerEnv } = await import("@/lib/server/env");

    const env = getServerEnv();

    expect(env).toEqual({
      geminiApiKey: "server-gemini-key",
      supabaseServiceRoleKey: "server-only-placeholder",
      supabasePublishableKey: "public-anon-key",
      supabaseUrl: "https://motioncode.supabase.co",
    });
  });

  it("throws a clear error when the Gemini server key is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://motioncode.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    delete process.env.GEMINI_API_KEY;

    const { getServerEnv } = await import("@/lib/server/env");

    expect(() => getServerEnv()).toThrow("Missing GEMINI_API_KEY");
  });

  it("throws a clear error when Supabase public server config is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    process.env.GEMINI_API_KEY = "server-gemini-key";

    const { getServerEnv } = await import("@/lib/server/env");

    expect(() => getServerEnv()).toThrow("Missing NEXT_PUBLIC_SUPABASE_URL");
  });

  it("throws a clear error when the Supabase service role key is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://motioncode.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    process.env.GEMINI_API_KEY = "server-gemini-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { getServerEnv } = await import("@/lib/server/env");

    expect(() => getServerEnv()).toThrow("Missing SUPABASE_SERVICE_ROLE_KEY");
  });

  it("returns validated Razorpay billing env values", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_motioncode";
    process.env.RAZORPAY_KEY_SECRET = "razorpay_secret";
    process.env.RAZORPAY_PRO_PLAN_ID = "plan_pro";
    process.env.RAZORPAY_STUDIO_PLAN_ID = "plan_studio";
    process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT = "120";
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_razorpay";

    const { getRazorpayBillingEnv } = await import("@/lib/server/env");

    expect(getRazorpayBillingEnv()).toEqual({
      keyId: "rzp_test_motioncode",
      keySecret: "razorpay_secret",
      proPlanId: "plan_pro",
      studioPlanId: "plan_studio",
      subscriptionTotalCount: 120,
      webhookSecret: "whsec_razorpay",
    });
  });

  it("rejects placeholder Razorpay secrets", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_motioncode";
    process.env.RAZORPAY_KEY_SECRET = "your_razorpay_key_secret";
    process.env.RAZORPAY_PRO_PLAN_ID = "plan_pro";
    process.env.RAZORPAY_STUDIO_PLAN_ID = "plan_studio";
    process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT = "120";
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_razorpay";

    const { getRazorpayBillingEnv } = await import("@/lib/server/env");

    expect(() => getRazorpayBillingEnv()).toThrow(
      "Invalid RAZORPAY_KEY_SECRET",
    );
  });

  it("rejects placeholder Razorpay IDs", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_your_key_id";
    process.env.RAZORPAY_KEY_SECRET = "razorpay_secret";
    process.env.RAZORPAY_PRO_PLAN_ID = "plan_pro";
    process.env.RAZORPAY_STUDIO_PLAN_ID = "plan_studio";
    process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT = "120";
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_razorpay";

    const { getRazorpayBillingEnv } = await import("@/lib/server/env");

    expect(() => getRazorpayBillingEnv()).toThrow("Invalid RAZORPAY_KEY_ID");
  });

  it("requires live Razorpay keys when paid checkout is enabled", async () => {
    process.env.MOTIONCODE_LAUNCH_PHASE = "paid";
    process.env.MOTIONCODE_ENABLE_PAID_CHECKOUT = "true";
    process.env.RAZORPAY_KEY_ID = "rzp_test_motioncode";
    process.env.RAZORPAY_KEY_SECRET = "razorpay_secret";
    process.env.RAZORPAY_PRO_PLAN_ID = "plan_pro";
    process.env.RAZORPAY_STUDIO_PLAN_ID = "plan_studio";
    process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT = "120";
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_razorpay";

    const { getRazorpayBillingEnv } = await import("@/lib/server/env");

    expect(() => getRazorpayBillingEnv()).toThrow(
      "paid checkout requires live keys",
    );
  });

  it("requires distinct Razorpay plan IDs", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_live_motioncode";
    process.env.RAZORPAY_KEY_SECRET = "razorpay_secret";
    process.env.RAZORPAY_PRO_PLAN_ID = "plan_motioncode";
    process.env.RAZORPAY_STUDIO_PLAN_ID = "plan_motioncode";
    process.env.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT = "120";
    process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_razorpay";

    const { getRazorpayBillingEnv } = await import("@/lib/server/env");

    expect(() => getRazorpayBillingEnv()).toThrow(
      "Invalid RAZORPAY_STUDIO_PLAN_ID",
    );
  });
});
