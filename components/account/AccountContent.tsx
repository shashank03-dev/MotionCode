import {
  ArrowUpRight,
  Check,
  CreditCard,
  Download,
  Lock,
  Trash2,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  requestAccountDeletionAction,
  requestDataExportAction,
} from "@/app/account/actions";
import { Panel } from "@/components/ui/kit";
import { ButtonLink } from "@/components/ui/site-button";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import { getCurrentUser } from "@/lib/supabase/server";

type AccountContentProps = {
  /** Optional flash notices (rendered above the content) for the full page. */
  notices?: ReactNode;
};

/**
 * The body of the Account surface — identity, live usage, plan entitlements,
 * billing, and data controls. Rendered both by the standalone `/account` page
 * and by the blurred `@modal` intercept over `/app` (inside RouteModal), so the
 * two views never drift apart. This file owns only the inner content; the page
 * chrome and modal shell live elsewhere.
 */
export async function AccountContent({ notices }: AccountContentProps = {}) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <p className="text-[15px] leading-7 text-ink-2">
        Account settings are available after authentication.
      </p>
    );
  }

  const summary = await getEntitlementSummary(user.id);
  const { entitlements, profile, subscription, usage } = summary;
  const isFree = summary.planTier === "free";

  const email = profile?.email ?? user.email ?? "Unknown";
  const displayName = profile?.display_name?.trim() || email.split("@")[0];
  const monogram = (displayName[0] ?? "?").toUpperCase();

  const daily = usage.dailyAnalyses;
  const usedPct =
    daily.limit > 0 ? Math.min(100, Math.round((daily.used / daily.limit) * 100)) : 0;

  const planRows: Array<[string, string]> = [
    ["Daily analyses", daily.limit.toLocaleString()],
    ["Frames / analysis", entitlements.maxFramesPerAnalysis.toLocaleString()],
    ["Upload limit", `${Math.round(entitlements.maxUploadBytes / 1024 / 1024)} MB`],
    ["Saved projects", entitlements.savedProjects.toLocaleString()],
    ["Workspaces", entitlements.workspaceCount.toLocaleString()],
    ["Team seats", entitlements.teamSeats.toLocaleString()],
  ];

  const capabilities: Array<[string, boolean]> = [
    ["Share links", entitlements.shareLinks],
    ["Comments", entitlements.comments],
    ["Project versioning", entitlements.projectVersioning],
  ];

  return (
    <div className="flex flex-col gap-5">
      {notices}

      {/* Identity + contextual primary action */}
      <Panel variant="glass" inset="none" radius="2xl" className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span
              aria-hidden="true"
              className="grid size-12 shrink-0 place-items-center rounded-2xl border border-accent-border bg-accent-dim font-display text-lg font-medium text-accent"
            >
              {monogram}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-medium tracking-tight text-ink">
                {displayName}
              </p>
              <p className="truncate text-[13.5px] text-ink-2">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <PlanBadge tier={summary.planTier} />
            {isFree ? (
              <ButtonLink href="/pricing" variant="primary" size="sm">
                Upgrade
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            ) : (
              <ButtonLink href="/billing" variant="frosted" size="sm">
                <CreditCard className="size-4" aria-hidden="true" />
                Billing
              </ButtonLink>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
        {/* Live usage meter */}
        <Card title="Usage today" eyebrow="Analyses">
          <div className="flex items-end justify-between">
            <p className="font-display text-4xl font-medium tracking-tightest text-ink">
              {daily.used.toLocaleString()}
              <span className="text-ink-3">/{daily.limit.toLocaleString()}</span>
            </p>
            <p className="pb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
              {daily.remaining.toLocaleString()} left
            </p>
          </div>
          <div
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={daily.limit}
            aria-valuenow={daily.used}
          >
            <div
              className="h-full rounded-full bg-accent shadow-glow transition-[width]"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className="mt-3 text-[13px] leading-6 text-ink-2">
            Your daily quota resets every 24 hours.
            {isFree ? " Upgrade for a higher ceiling and paid tools." : ""}
          </p>
        </Card>

        {/* Plan entitlements + capability chips */}
        <Card title="Your plan includes" eyebrow="Entitlements">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {planRows.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-3">
                  {label}
                </dt>
                <dd className="mt-1 font-mono text-[14px] text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-hairline pt-5">
            {capabilities.map(([label, enabled]) => (
              <CapabilityChip key={label} label={label} enabled={enabled} />
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Billing */}
        <Card title="Billing" eyebrow="Subscription">
          {isFree ? (
            <>
              <p className="text-[14px] leading-6 text-ink-2">
                You&apos;re on the free plan. Upgrade to save analyses as
                versioned projects, create workspaces, and invite your team.
              </p>
              <ButtonLink
                href="/pricing"
                variant="primary"
                size="sm"
                className="mt-5 w-full"
              >
                View paid plans
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </>
          ) : (
            <>
              <dl className="grid gap-4">
                <Detail
                  label="Provider"
                  value={
                    subscription?.payment_provider
                      ? titleCase(subscription.payment_provider)
                      : "None"
                  }
                />
                <Detail
                  label="Status"
                  value={subscription?.status ? titleCase(subscription.status) : "Active"}
                />
                <Detail
                  label="Renews"
                  value={
                    subscription?.current_period_end
                      ? formatDate(subscription.current_period_end)
                      : "Not scheduled"
                  }
                />
                {subscription?.cancel_at_period_end ? (
                  <Detail label="Cancels" value="At end of current period" />
                ) : null}
              </dl>
              <ButtonLink
                href="/billing"
                variant="frosted"
                size="sm"
                className="mt-5 w-full"
              >
                <CreditCard className="size-4" aria-hidden="true" />
                Manage billing
              </ButtonLink>
            </>
          )}
        </Card>

        {/* Data & privacy */}
        <Card title="Data & privacy" eyebrow="Your data">
          <p className="text-[14px] leading-6 text-ink-2">
            Export a copy of your data, or request permanent deletion of your
            account and everything in it.
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <form action={requestDataExportAction}>
              <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-hairline bg-white/[0.03] px-4 text-[13px] text-ink-2 transition hover:border-accent-border hover:text-ink">
                <Download className="size-4" aria-hidden="true" />
                Request data export
              </button>
            </form>
            <form action={requestAccountDeletionAction}>
              <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--danger-border)] px-4 text-[13px] text-[var(--danger)] transition hover:bg-[rgba(232,112,95,0.08)]">
                <Trash2 className="size-4" aria-hidden="true" />
                Request account deletion
              </button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}

/** A titled content block used across the account grid. */
function Card({
  children,
  eyebrow,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <Panel
      as="section"
      variant="glass"
      inset="none"
      radius="2xl"
      className="flex flex-col p-5 sm:p-6"
    >
      <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-3">
        {eyebrow}
      </span>
      <h2 className="mb-5 mt-1.5 font-display text-[15px] font-medium tracking-tight text-ink">
        {title}
      </h2>
      {children}
    </Panel>
  );
}

function PlanBadge({ tier }: { tier: string }) {
  const isFree = tier === "free";
  return (
    <span
      className={
        isFree
          ? "inline-flex items-center rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3"
          : "inline-flex items-center rounded-full border border-accent-border bg-accent-dim px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-accent"
      }
    >
      {titleCase(tier)}
    </span>
  );
}

function CapabilityChip({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className={
        enabled
          ? "inline-flex items-center gap-1.5 rounded-full border border-accent-border bg-accent-dim px-3 py-1.5 text-[12.5px] text-ink"
          : "inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-[12.5px] text-ink-3"
      }
    >
      {enabled ? (
        <Check className="size-3.5 text-accent" aria-hidden="true" />
      ) : (
        <Lock className="size-3.5" aria-hidden="true" />
      )}
      {label}
    </span>
  );
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
