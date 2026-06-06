import { apiError, apiSuccess, ApiError, isApiError } from "@/lib/server/apiErrors";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import { createBillingPortalSession } from "@/lib/server/stripe";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to manage billing.");
  }

  try {
    const summary = await getEntitlementSummary(user.id);
    const customerId =
      summary.profile?.stripe_customer_id ??
      summary.subscription?.stripe_customer_id;

    if (!customerId) {
      return apiError(
        "BILLING_REQUIRED",
        "Start a paid plan before opening the billing portal.",
      );
    }

    const url = await createBillingPortalSession({
      customerId,
      origin: new URL(request.url).origin,
    });

    return apiSuccess({ url });
  } catch (error) {
    const apiFailure = toApiFailure(
      error,
      "Unable to create Stripe portal session.",
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
