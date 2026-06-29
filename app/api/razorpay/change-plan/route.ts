import { type PlanTier } from "@/lib/contracts/plans";
import { isPaidCheckoutEnabled } from "@/lib/contracts/launch";
import { apiError, apiSuccess, ApiError, isApiError } from "@/lib/server/apiErrors";
import { checkBillingRateLimit } from "@/lib/server/billingRateLimit";
import { observeAuthError } from "@/lib/server/observability";
import { changeRazorpaySubscriptionPlan } from "@/lib/server/razorpay";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isPaidCheckoutEnabled()) {
    return apiError("FORBIDDEN", "Paid checkout is disabled during beta.");
  }

  const user = await getCurrentUser();
  if (!user) {
    await observeAuthError({
      action: "razorpay_change_plan",
      reason: "missing_session",
      route: "/api/razorpay/change-plan",
    });

    return apiError("UNAUTHENTICATED", "Sign in to manage billing.");
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
    return apiError("INVALID_REQUEST", "Request must be valid JSON.");
  }

  if (planTier !== "pro" && planTier !== "studio") {
    return apiError("INVALID_REQUEST", "Choose a paid plan to switch to.");
  }

  try {
    const result = await changeRazorpaySubscriptionPlan({
      targetPlanTier: planTier,
      userId: user.id,
    });
    return apiSuccess(result);
  } catch (error) {
    const apiFailure = toApiFailure(
      error,
      "Unable to change Razorpay subscription plan.",
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
