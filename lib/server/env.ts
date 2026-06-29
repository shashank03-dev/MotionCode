import { z } from "zod";

import {
  getLaunchPhase,
  isPaidCheckoutEnabled,
  isRazorpayTestCheckoutEnabled,
} from "@/lib/contracts/launch";

const ServerEnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1).refine(isNotPlaceholder),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).refine(isNotPlaceholder),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().refine(isNotPlaceholder),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).refine(isNotPlaceholder),
});

const RazorpayBillingEnvSchema = z.object({
  RAZORPAY_KEY_ID: z.string()
    .regex(/^rzp_(test|live)_[A-Za-z0-9_]+$/)
    .refine(isNotPlaceholder),
  RAZORPAY_KEY_SECRET: z.string().min(8).refine(isNotPlaceholder),
  RAZORPAY_PRO_PLAN_ID: z.string()
    .regex(/^plan_[A-Za-z0-9_]+$/)
    .refine(isNotPlaceholder),
  RAZORPAY_STUDIO_PLAN_ID: z.string()
    .regex(/^plan_[A-Za-z0-9_]+$/)
    .refine(isNotPlaceholder),
  RAZORPAY_SUBSCRIPTION_TOTAL_COUNT: z.coerce.number().int().positive(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(8).refine(isNotPlaceholder),
}).superRefine((value, context) => {
  if (value.RAZORPAY_PRO_PLAN_ID === value.RAZORPAY_STUDIO_PLAN_ID) {
    context.addIssue({
      code: "custom",
      message: "Pro and Studio Razorpay plans must be distinct.",
      path: ["RAZORPAY_STUDIO_PLAN_ID"],
    });
  }
});

export type ServerEnv = {
  geminiApiKey: string;
  supabasePublishableKey: string;
  supabaseServiceRoleKey: string;
  supabaseUrl: string;
};

export type RazorpayBillingEnv = {
  keyId: string;
  keySecret: string;
  proPlanId: string;
  studioPlanId: string;
  subscriptionTotalCount: number;
  webhookSecret: string;
};

const REQUIRED_ENV_KEYS = [
  "GEMINI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const REQUIRED_RAZORPAY_ENV_KEYS = [
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_PRO_PLAN_ID",
  "RAZORPAY_STUDIO_PLAN_ID",
  "RAZORPAY_SUBSCRIPTION_TOTAL_COUNT",
  "RAZORPAY_WEBHOOK_SECRET",
] as const;

export function getServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  for (const key of REQUIRED_ENV_KEYS) {
    if (!env[key]) {
      throw new Error(`Missing ${key}`);
    }
  }

  const parsed = ServerEnvSchema.safeParse(env);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const key = issue?.path.join(".") || "server env";
    throw new Error(`Invalid ${key}: ${issue?.message ?? "unknown error"}`);
  }

  return {
    geminiApiKey: parsed.data.GEMINI_API_KEY,
    supabasePublishableKey: parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
  };
}

export function getRazorpayBillingEnv(
  env: NodeJS.ProcessEnv = process.env,
): RazorpayBillingEnv {
  for (const key of REQUIRED_RAZORPAY_ENV_KEYS) {
    if (!env[key]) {
      throw new Error(`Missing ${key}`);
    }
  }

  const parsed = RazorpayBillingEnvSchema.safeParse(env);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const key = issue?.path.join(".") || "Razorpay billing env";
    throw new Error(`Invalid ${key}: ${issue?.message ?? "unknown error"}`);
  }

  // Go-live guardrail: in the paid launch phase, test checkout must be off.
  // Otherwise checkout stays enabled while canTrustPaidBillingEntitlements()
  // is false, so paying customers would be charged but written back as "free".
  if (getLaunchPhase(env) === "paid" && isRazorpayTestCheckoutEnabled(env)) {
    throw new Error(
      "Invalid billing config: disable MOTIONCODE_ENABLE_RAZORPAY_TEST_CHECKOUT in the paid launch phase — it would grant the free tier to paying customers.",
    );
  }

  if (
    isPaidCheckoutEnabled(env) &&
    !isRazorpayTestCheckoutEnabled(env) &&
    !parsed.data.RAZORPAY_KEY_ID.startsWith("rzp_live_")
  ) {
    throw new Error("Invalid RAZORPAY_KEY_ID: paid checkout requires live keys");
  }

  return {
    keyId: parsed.data.RAZORPAY_KEY_ID,
    keySecret: parsed.data.RAZORPAY_KEY_SECRET,
    proPlanId: parsed.data.RAZORPAY_PRO_PLAN_ID,
    studioPlanId: parsed.data.RAZORPAY_STUDIO_PLAN_ID,
    subscriptionTotalCount: parsed.data.RAZORPAY_SUBSCRIPTION_TOTAL_COUNT,
    webhookSecret: parsed.data.RAZORPAY_WEBHOOK_SECRET,
  };
}

function isNotPlaceholder(value: string) {
  return !/(^your[-_])|[_-]your[_-]|placeholder|replace|example/i.test(value);
}
