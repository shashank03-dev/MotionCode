import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getEntitlementSummary } from "@/lib/server/entitlements";
import { createBillingPortalSession } from "@/lib/server/stripe";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/account?auth=required");
  }

  const summary = await getEntitlementSummary(user.id);
  const customerId =
    summary.profile?.stripe_customer_id ?? summary.subscription?.stripe_customer_id;

  if (!customerId) {
    redirect("/pricing?billing=checkout-required");
  }

  const url = await createBillingPortalSession({
    customerId,
    origin: requestOrigin(),
  });

  redirect(url);
}

function requestOrigin() {
  const requestHeaders = headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  }

  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const protocol =
    forwardedProto ?? (host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}
