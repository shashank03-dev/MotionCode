import { type PlanTier } from "@/lib/contracts/plans";
import { isPaidCheckoutEnabled } from "@/lib/contracts/launch";
import { apiError, apiSuccess, ApiError, isApiError } from "@/lib/server/apiErrors";
import { checkBillingRateLimit } from "@/lib/server/billingRateLimit";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import { observeAuthError } from "@/lib/server/observability";
import { createRazorpayCheckoutSubscription } from "@/lib/server/razorpay";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isPaidCheckoutEnabled()) {
    return apiError("FORBIDDEN", "Paid checkout is disabled during beta.");
  }

  const user = await getCurrentUser();
  if (!user) {
    await observeAuthError({
      action: "razorpay_checkout",
      reason: "missing_session",
      route: "/api/razorpay/checkout",
    });

    return apiError("UNAUTHENTICATED", "Sign in to start checkout.");
  }

  const rateLimited = checkBillingRateLimit(user.id);
  if (rateLimited) {
    return apiError(rateLimited.code, rateLimited.message, {
      status: rateLimited.status,
    });
  }

  let planTier: PlanTier | null;
  try {
    planTier = await readPlanTier(request);
  } catch {
    return apiError("INVALID_REQUEST", "Checkout request must be valid JSON.");
  }

  if (planTier !== "pro" && planTier !== "studio") {
    return apiError("INVALID_REQUEST", "Choose a paid plan to start checkout.");
  }

  try {
    const summary = await getEntitlementSummary(user.id);
    const checkout = await createRazorpayCheckoutSubscription({
      email: summary.profile?.email ?? user.email ?? null,
      planTier,
      userId: user.id,
    });

    return apiSuccess(checkout);
  } catch (error) {
    const apiFailure = toApiFailure(
      error,
      "Unable to create Razorpay checkout.",
    );
    return apiError(apiFailure.code, apiFailure.message, {
      status: apiFailure.status,
    });
  }
}

async function readPlanTier(request: Request): Promise<PlanTier | null> {
  const body = (await request.json()) as { planTier?: unknown };
  return typeof body.planTier === "string" ? (body.planTier as PlanTier) : null;
}

function toApiFailure(error: unknown, fallbackMessage: string) {
  if (isApiError(error)) {
    return error;
  }

  return new ApiError("INTERNAL_ERROR", fallbackMessage);
}
