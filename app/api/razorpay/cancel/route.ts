import { isPaidCheckoutEnabled } from "@/lib/contracts/launch";
import { apiError, apiSuccess, ApiError, isApiError } from "@/lib/server/apiErrors";
import { checkBillingRateLimit } from "@/lib/server/billingRateLimit";
import { observeAuthError } from "@/lib/server/observability";
import { cancelRazorpaySubscription } from "@/lib/server/razorpay";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  if (!isPaidCheckoutEnabled()) {
    return apiError("FORBIDDEN", "Paid checkout is disabled during beta.");
  }

  const user = await getCurrentUser();
  if (!user) {
    await observeAuthError({
      action: "razorpay_cancel",
      reason: "missing_session",
      route: "/api/razorpay/cancel",
    });

    return apiError("UNAUTHENTICATED", "Sign in to manage billing.");
  }

  const rateLimited = checkBillingRateLimit(user.id);
  if (rateLimited) {
    return apiError(rateLimited.code, rateLimited.message, {
      status: rateLimited.status,
    });
  }

  try {
    const result = await cancelRazorpaySubscription({ userId: user.id });
    return apiSuccess(result);
  } catch (error) {
    const apiFailure = toApiFailure(
      error,
      "Unable to cancel Razorpay subscription.",
    );
    return apiError(apiFailure.code, apiFailure.message, {
      status: apiFailure.status,
    });
  }
}

function toApiFailure(error: unknown, fallbackMessage: string) {
  if (isApiError(error)) {
    return error;
  }

  return new ApiError("INTERNAL_ERROR", fallbackMessage);
}
