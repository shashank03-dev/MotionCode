import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, CreditCard, Receipt, Shield } from "lucide-react";

import { type PlanTier } from "@/lib/contracts/plans";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import {
  getRazorpaySubscriptionSchedule,
  listRazorpaySubscriptionInvoices,
  type RazorpayInvoiceSummary,
} from "@/lib/server/razorpay";
import { getCurrentUser } from "@/lib/supabase/server";

import { CancelSubscriptionButton } from "./CancelSubscriptionButton";
import { ChangePlanButton } from "./ChangePlanButton";

export const dynamic = "force-dynamic";

const MANAGEABLE_STATUSES = new Set([
  "active",
  "authenticated",
  "past_due",
  "trialing",
]);

type BillingPageProps = {
  searchParams?: Promise<{
    plan?: string;
    subscription?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/account?auth=required");
  }

  const resolvedSearchParams = await searchParams;
  const summary = await getEntitlementSummary(user.id);
  const subscription = summary.subscription;
  const subscriptionId = subscription?.razorpay_subscription_id ?? null;
  const planTier = isPaidPlanTier(subscription?.plan_tier)
    ? subscription.plan_tier
    : summary.planTier;
  const isManageable =
    Boolean(subscriptionId) &&
    typeof subscription?.status === "string" &&
    MANAGEABLE_STATUSES.has(subscription.status);
  const renewalLabel = subscription?.current_period_end
    ? formatDate(subscription.current_period_end)
    : "the end of the current billing period";

  const invoices = subscriptionId
    ? await safeListInvoices(subscriptionId)
    : [];
  const hasScheduledChange =
    subscriptionId && !subscription?.cancel_at_period_end
      ? await safeHasScheduledChange(subscriptionId)
      : false;

  const notice = resolveNotice(resolvedSearchParams);

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/account"
              className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              Account
            </Link>
            <h1 className="mt-3 font-mono text-4xl">Billing</h1>
          </div>
          <Link
            className="inline-flex h-10 items-center gap-2 border border-[var(--border)] px-4 font-mono text-sm text-[var(--accent)]"
            href="/pricing"
          >
            View plans
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

        {notice ? (
          <div className="border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 py-3 font-mono text-sm text-[var(--text)]">
            {notice}
          </div>
        ) : null}

        <section className="border border-[var(--border)] bg-[#171812] p-6">
          <div className="mb-5 flex items-center gap-2 text-[var(--accent)]">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-mono text-lg">Current plan</h2>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Plan" value={titleCase(planTier)} />
            <Detail
              label="Status"
              value={subscription?.status ? titleCase(subscription.status) : "Free"}
            />
            <Detail
              label="Renews"
              value={
                subscription?.current_period_end
                  ? formatDate(subscription.current_period_end)
                  : "Not scheduled"
              }
            />
            <Detail
              label="Cancel at period end"
              value={subscription?.cancel_at_period_end ? "Yes" : "No"}
            />
          </dl>
        </section>

        {isManageable && isPaidPlanTier(planTier) ? (
          <section className="border border-[var(--border)] bg-[#171812] p-6">
            <div className="mb-5 flex items-center gap-2 text-[var(--accent)]">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-mono text-lg">Manage subscription</h2>
            </div>

            {subscription?.cancel_at_period_end ? (
              <p className="text-sm leading-6 text-[var(--muted)]">
                This subscription is scheduled to end on {renewalLabel}. To keep
                using a paid plan after that, subscribe again from{" "}
                <Link className="text-[var(--accent)] underline" href="/pricing">
                  pricing
                </Link>
                .
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  {hasScheduledChange ? (
                    <p className="text-sm leading-6 text-[var(--muted)]">
                      A plan change is already scheduled for the end of your
                      current billing cycle. It will apply automatically on{" "}
                      {renewalLabel}.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm leading-6 text-[var(--muted)]">
                        {planTier === "pro"
                          ? "Upgrade to Studio for more seats, workspaces, and analyses. Takes effect immediately."
                          : "Switch to Pro. The change applies at the end of your current billing cycle."}
                      </p>
                      {planTier === "pro" ? (
                        <ChangePlanButton
                          label="Upgrade to Studio"
                          targetPlanTier="studio"
                        />
                      ) : (
                        <ChangePlanButton
                          label="Switch to Pro"
                          targetPlanTier="pro"
                        />
                      )}
                    </>
                  )}
                </div>

                <div className="border-t border-[var(--border)] pt-6">
                  <CancelSubscriptionButton renewalLabel={renewalLabel} />
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="border border-[var(--border)] bg-[#171812] p-6">
            <div className="mb-5 flex items-center gap-2 text-[var(--accent)]">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
              <h2 className="font-mono text-lg">No active subscription</h2>
            </div>
            <p className="text-sm leading-6 text-[var(--muted)]">
              You are on the free plan. Choose Pro or Studio to unlock more
              analyses, seats, and workspaces.
            </p>
            <Link
              className="mt-6 inline-flex h-10 items-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-mono text-sm text-[var(--text)]"
              href="/pricing"
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              View paid plans
            </Link>
          </section>
        )}

        <section className="border border-[var(--border)] bg-[#171812] p-6">
          <div className="mb-5 flex items-center gap-2 text-[var(--accent)]">
            <Receipt className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-mono text-lg">Payment history</h2>
          </div>
          {invoices.length > 0 ? (
            <ul className="flex flex-col divide-y divide-[var(--border)]">
              {invoices.map((invoice) => (
                <li
                  key={invoice.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 font-mono text-sm"
                >
                  <span className="text-[var(--accent)]">
                    {invoice.issuedAt ? formatDate(invoice.issuedAt) : "—"}
                  </span>
                  <span className="text-[var(--text)]">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </span>
                  <span className="text-[var(--muted)]">
                    {titleCase(invoice.status)}
                  </span>
                  {invoice.shortUrl ? (
                    <a
                      className="inline-flex items-center gap-1 text-[var(--accent)] underline"
                      href={invoice.shortUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Download
                      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                    </a>
                  ) : (
                    <span className="text-[var(--muted)]">{"—"}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-[var(--muted)]">
              No invoices yet.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

async function safeListInvoices(
  subscriptionId: string,
): Promise<RazorpayInvoiceSummary[]> {
  try {
    return await listRazorpaySubscriptionInvoices(subscriptionId);
  } catch {
    return [];
  }
}

async function safeHasScheduledChange(subscriptionId: string): Promise<boolean> {
  try {
    const schedule = await getRazorpaySubscriptionSchedule(subscriptionId);
    return schedule.hasScheduledChanges;
  } catch {
    return false;
  }
}

function resolveNotice(
  params: { plan?: string; subscription?: string } | undefined,
) {
  if (params?.subscription === "canceled") {
    return "Cancellation scheduled. You keep paid access until your renewal date.";
  }
  if (params?.plan === "upgraded") {
    return "Plan upgraded. Your new plan is active now.";
  }
  if (params?.plan === "scheduled") {
    return "Plan change scheduled for the end of your current billing cycle.";
  }
  return null;
}

function isPaidPlanTier(
  value: unknown,
): value is Extract<PlanTier, "pro" | "studio"> {
  return value === "pro" || value === "studio";
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-xs uppercase text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 break-words text-sm text-[var(--accent)]">{value}</dd>
    </div>
  );
}

function titleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function formatAmount(amountInPaise: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      currency,
      style: "currency",
    }).format(amountInPaise / 100);
  } catch {
    return `${(amountInPaise / 100).toFixed(2)} ${currency}`;
  }
}
