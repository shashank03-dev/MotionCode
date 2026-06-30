import Link from "next/link";
import { CreditCard, Receipt, Shield } from "lucide-react";

import { CancelSubscriptionButton } from "@/app/billing/CancelSubscriptionButton";
import { ChangePlanButton } from "@/app/billing/ChangePlanButton";
import { type PlanTier } from "@/lib/contracts/plans";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import {
  getRazorpaySubscriptionSchedule,
  listRazorpaySubscriptionInvoices,
  type RazorpayInvoiceSummary,
} from "@/lib/server/razorpay";
import { getCurrentUser } from "@/lib/supabase/server";

const MANAGEABLE_STATUSES = new Set([
  "active",
  "authenticated",
  "past_due",
  "trialing",
]);

type BillingContentProps = {
  /** Optional flash notice (rendered above the plan card) for the full page. */
  notice?: string | null;
};

/**
 * The body of the Billing surface — current plan, subscription management, and
 * payment history. Shared by the standalone `/billing` page and the `@modal`
 * intercept so both render identical content.
 */
export async function BillingContent({
  notice = null,
}: BillingContentProps = {}) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <p className="font-sans text-sm leading-6 text-[var(--accent)]">
        Billing is available after authentication.
      </p>
    );
  }

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

  const invoices = subscriptionId ? await safeListInvoices(subscriptionId) : [];
  const hasScheduledChange =
    subscriptionId && !subscription?.cancel_at_period_end
      ? await safeHasScheduledChange(subscriptionId)
      : false;

  return (
    <div className="flex flex-col gap-8">
      {notice ? (
        <div className="rounded-lg border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 py-3 font-sans text-sm text-[var(--text)]">
          {notice}
        </div>
      ) : null}

      <section className="rounded-xl border border-[var(--border)] bg-[#15160f] p-6 shadow-[inset_0_1px_0_rgba(255,251,244,0.04)]">
        <div className="mb-5 flex items-center gap-2.5 text-[var(--accent)]">
          <Shield className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-sans text-base font-medium tracking-tight text-[var(--text)]">
            Current plan
          </h2>
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
            <h2 className="font-sans text-base font-medium tracking-tight text-[var(--text)]">
              Manage subscription
            </h2>
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
            <h2 className="font-sans text-base font-medium tracking-tight text-[var(--text)]">
              No active subscription
            </h2>
          </div>
          <p className="text-sm leading-6 text-[var(--muted)]">
            You are on the free plan. Choose Pro or Studio to unlock more
            analyses, seats, and workspaces.
          </p>
          <Link
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-md border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-sans text-sm text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10"
            href="/pricing"
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            View paid plans
          </Link>
        </section>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[#15160f] p-6 shadow-[inset_0_1px_0_rgba(255,251,244,0.04)]">
        <div className="mb-5 flex items-center gap-2.5 text-[var(--accent)]">
          <Receipt className="h-5 w-5" aria-hidden="true" />
          <h2 className="font-sans text-base font-medium tracking-tight text-[var(--text)]">
            Payment history
          </h2>
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
                  </a>
                ) : (
                  <span className="text-[var(--muted)]">{"—"}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-[var(--muted)]">No invoices yet.</p>
        )}
      </section>
    </div>
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

function isPaidPlanTier(
  value: unknown,
): value is Extract<PlanTier, "pro" | "studio"> {
  return value === "pro" || value === "studio";
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </dt>
      <dd className="mt-1.5 break-words font-sans text-sm text-[var(--accent)]">
        {value}
      </dd>
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
