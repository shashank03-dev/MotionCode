import Link from "next/link";
import { CreditCard, Gift, Receipt, Shield } from "lucide-react";
import type { ReactNode } from "react";

import { CancelSubscriptionButton } from "@/app/billing/CancelSubscriptionButton";
import { ChangePlanButton } from "@/app/billing/ChangePlanButton";
import { Panel, Pill } from "@/components/ui/kit";
import { ButtonLink } from "@/components/ui/site-button";
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
      <p className="text-[15px] leading-7 text-ink-2">
        Billing is available after authentication.
      </p>
    );
  }

  const summary = await getEntitlementSummary(user.id);
  const subscription = summary.subscription;
  const subscriptionId = subscription?.razorpay_subscription_id ?? null;
  // An admin override is a "giveaway": the user has full access to the plan
  // without a paid Razorpay subscription. It always wins over a subscription
  // in entitlement resolution, so surface it as its own complimentary state.
  const isComplimentary = summary.source === "admin_override";
  const override = summary.override;
  const planTier = isComplimentary
    ? summary.planTier
    : isPaidPlanTier(subscription?.plan_tier)
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
    <div className="flex flex-col gap-5">
      {notice ? (
        <Panel
          variant="hairline"
          inset="none"
          radius="xl"
          className="border-l-2 border-l-accent px-4 py-3 text-[14px] text-ink"
        >
          {notice}
        </Panel>
      ) : null}

      <Section icon={<Shield className="size-4" aria-hidden="true" />} title="Current plan">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label="Plan" value={titleCase(planTier)} />
          <Detail
            label="Status"
            value={
              isComplimentary
                ? "Complimentary"
                : subscription?.status
                  ? titleCase(subscription.status)
                  : "Free"
            }
          />
          {isComplimentary ? (
            <>
              <Detail
                label="Access until"
                value={
                  override?.expires_at
                    ? formatDate(override.expires_at)
                    : "No expiry"
                }
              />
              <Detail
                label="Granted"
                value={
                  override?.created_at ? formatDate(override.created_at) : "—"
                }
              />
            </>
          ) : (
            <>
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
            </>
          )}
        </dl>
      </Section>

      {isComplimentary ? (
        <Section
          icon={<Gift className="size-4" aria-hidden="true" />}
          title="Complimentary access"
          badge={<Pill tone="accent">Gifted</Pill>}
        >
          <p className="text-[14px] leading-6 text-ink-2">
            An admin granted you {titleCase(planTier)} at no charge. You have full
            access to every {titleCase(planTier)} feature
            {override?.expires_at
              ? ` until ${formatDate(override.expires_at)}`
              : " with no expiry date"}
            . No payment is required.
          </p>
          <ButtonLink href="/pricing" variant="frosted" size="sm" className="mt-6">
            <CreditCard className="size-4" aria-hidden="true" />
            View paid plans
          </ButtonLink>
        </Section>
      ) : isManageable && isPaidPlanTier(planTier) ? (
        <Section
          icon={<CreditCard className="size-4" aria-hidden="true" />}
          title="Manage subscription"
        >
          {subscription?.cancel_at_period_end ? (
            <p className="text-[14px] leading-6 text-ink-2">
              This subscription is scheduled to end on {renewalLabel}. To keep
              using a paid plan after that, subscribe again from{" "}
              <Link className="text-accent underline underline-offset-4" href="/pricing">
                pricing
              </Link>
              .
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-start gap-3.5">
                {hasScheduledChange ? (
                  <p className="text-[14px] leading-6 text-ink-2">
                    A plan change is already scheduled for the end of your current
                    billing cycle. It will apply automatically on {renewalLabel}.
                  </p>
                ) : (
                  <>
                    <p className="text-[14px] leading-6 text-ink-2">
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
                      <ChangePlanButton label="Switch to Pro" targetPlanTier="pro" />
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-hairline pt-6">
                <CancelSubscriptionButton renewalLabel={renewalLabel} />
              </div>
            </div>
          )}
        </Section>
      ) : (
        <Section
          icon={<CreditCard className="size-4" aria-hidden="true" />}
          title="No active subscription"
        >
          <p className="text-[14px] leading-6 text-ink-2">
            You are on the free plan. Choose Pro or Studio to unlock more analyses,
            seats, and workspaces.
          </p>
          <ButtonLink href="/pricing" variant="primary" size="sm" className="mt-6">
            <CreditCard className="size-4" aria-hidden="true" />
            View paid plans
          </ButtonLink>
        </Section>
      )}

      <Section icon={<Receipt className="size-4" aria-hidden="true" />} title="Payment history">
        {invoices.length > 0 ? (
          <ul className="flex flex-col divide-y divide-hairline">
            {invoices.map((invoice) => (
              <li
                key={invoice.id}
                className="grid grid-cols-2 items-center gap-3 py-3 font-mono text-[13px] sm:grid-cols-4"
              >
                <span className="text-ink-3">
                  {invoice.issuedAt ? formatDate(invoice.issuedAt) : "—"}
                </span>
                <span className="tabular-nums text-ink">
                  {formatAmount(invoice.amount, invoice.currency)}
                </span>
                <span className="text-ink-3">{titleCase(invoice.status)}</span>
                {invoice.shortUrl ? (
                  <a
                    className="justify-self-start text-accent underline underline-offset-4 transition hover:brightness-125 sm:justify-self-end"
                    href={invoice.shortUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Download
                  </a>
                ) : (
                  <span className="text-ink-3 sm:justify-self-end">—</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] leading-6 text-ink-2">No invoices yet.</p>
        )}
      </Section>
    </div>
  );
}

/** A titled block inside the billing stack. */
function Section({
  children,
  icon,
  title,
  badge,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
}) {
  return (
    <Panel as="section" variant="glass" inset="none" radius="2xl" className="p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-lg border border-hairline bg-white/[0.03] text-ink-3">
          {icon}
        </span>
        <h2 className="font-display text-[15px] font-medium tracking-tight text-ink">
          {title}
        </h2>
        {badge ? <span className="ml-auto">{badge}</span> : null}
      </div>
      {children}
    </Panel>
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
      <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-3">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-[14px] text-ink">{value}</dd>
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
