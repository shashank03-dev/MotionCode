import { type PlanTier } from "@/lib/contracts/plans";
import { apiError, apiSuccess, ApiError, isApiError } from "@/lib/server/apiErrors";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import { createCheckoutSession } from "@/lib/server/stripe";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
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
      origin: requestOrigin(request),
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

function requestOrigin(request: Request) {
  return new URL(request.url).origin;
}

function toApiFailure(error: unknown, fallbackMessage: string) {
  if (isApiError(error)) {
    return error;
  }

  return new ApiError("INTERNAL_ERROR", fallbackMessage);
}
