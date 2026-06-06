import { type PlanTier } from "@/lib/contracts/plans";
import { getRequestAppOrigin } from "@/lib/server/appOrigin";
import { apiError, apiSuccess, ApiError, isApiError } from "@/lib/server/apiErrors";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import { observeAuthError } from "@/lib/server/observability";
import { createCheckoutSession } from "@/lib/server/stripe";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    await observeAuthError({
      action: "stripe_checkout",
      reason: "missing_session",
      route: "/api/stripe/checkout",
    });

    return apiError("UNAUTHENTICATED", "Sign in to start checkout.");
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
    const customerId =
      summary.profile?.stripe_customer_id ??
      summary.subscription?.stripe_customer_id ??
      null;
    const url = await createCheckoutSession({
      customerId,
      email: summary.profile?.email ?? user.email ?? null,
      origin: getRequestAppOrigin(request),
      planTier,
      userId: user.id,
    });

    return apiSuccess({ url });
  } catch (error) {
    const apiFailure = toApiFailure(
      error,
      "Unable to create Stripe checkout.",
    );
    return apiError(apiFailure.code, apiFailure.message, {
      status: apiFailure.status,
    });
  }
}

async function readPlanTier(request: Request): Promise<PlanTier | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    const value = form.get("planTier");
    return typeof value === "string" ? (value as PlanTier) : null;
  }

  const body = (await request.json()) as { planTier?: unknown };
  return typeof body.planTier === "string" ? (body.planTier as PlanTier) : null;
}

function toApiFailure(error: unknown, fallbackMessage: string) {
  if (isApiError(error)) {
    return error;
  }

  return new ApiError("INTERNAL_ERROR", fallbackMessage);
}
