import { isPaidCheckoutEnabled } from "@/lib/contracts/launch";
import { apiError, apiSuccess, ApiError, isApiError } from "@/lib/server/apiErrors";
import { checkBillingRateLimit } from "@/lib/server/billingRateLimit";
import { observeAuthError } from "@/lib/server/observability";
import { verifyRazorpayCheckoutPayment } from "@/lib/server/razorpay";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isPaidCheckoutEnabled()) {
    return apiError("FORBIDDEN", "Paid checkout is disabled during beta.");
  }

  const user = await getCurrentUser();
  if (!user) {
    await observeAuthError({
      action: "razorpay_verify",
      reason: "missing_session",
      route: "/api/razorpay/verify",
    });

    return apiError("UNAUTHENTICATED", "Sign in to verify checkout.");
  }

  const rateLimited = checkBillingRateLimit(user.id);
  if (rateLimited) {
    return apiError(rateLimited.code, rateLimited.message, {
      status: rateLimited.status,
    });
  }

  let body: {
    razorpay_payment_id?: unknown;
    razorpay_signature?: unknown;
    razorpay_subscription_id?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return apiError("INVALID_REQUEST", "Verification request must be valid JSON.");
  }

  if (
    typeof body.razorpay_payment_id !== "string" ||
    typeof body.razorpay_signature !== "string" ||
    typeof body.razorpay_subscription_id !== "string"
  ) {
    return apiError("INVALID_REQUEST", "Missing Razorpay verification fields.");
  }

  try {
    const subscription = await verifyRazorpayCheckoutPayment({
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
      subscriptionId: body.razorpay_subscription_id,
      userId: user.id,
    });

    return apiSuccess(subscription);
  } catch (error) {
    const apiFailure = toApiFailure(
      error,
      "Unable to verify Razorpay checkout.",
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
