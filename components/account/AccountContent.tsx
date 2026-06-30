import Link from "next/link";
import {
  BarChart3,
  CreditCard,
  Download,
  Shield,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";

import {
  requestAccountDeletionAction,
  requestDataExportAction,
} from "@/app/account/actions";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import { getCurrentUser } from "@/lib/supabase/server";

type AccountContentProps = {
  /** Optional flash notices (rendered above the metrics) for the full page. */
  notices?: ReactNode;
};

/**
 * The body of the Account surface — metrics, profile, entitlements, billing,
 * upgrade, and data sections. Rendered both by the standalone `/account` page
 * (with its own page chrome) and by the `@modal` intercept (inside RouteModal),
 * so the two views never drift apart.
 */
export async function AccountContent({ notices }: AccountContentProps = {}) {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <p className="font-sans text-sm leading-6 text-[var(--accent)]">
        Account settings are available after authentication.
      </p>
    );
  }

  const summary = await getEntitlementSummary(user.id);
  const profile = summary.profile;
  const subscription = summary.subscription;
  const paymentProvider = subscription?.payment_provider ?? null;
  const subscriptionId = subscription?.razorpay_subscription_id;
  const entitlementRows = [
    ["Daily analyses", summary.entitlements.dailyAnalyses.toLocaleString()],
    [
      "Frames per analysis",
      summary.entitlements.maxFramesPerAnalysis.toLocaleString(),
    ],
    [
      "Upload limit",
      `${Math.round(summary.entitlements.maxUploadBytes / 1024 / 1024)} MB`,
    ],
    ["Saved projects", summary.entitlements.savedProjects.toLocaleString()],
    ["Team seats", summary.entitlements.teamSeats.toLocaleString()],
    [
      "Audit retention",
      `${summary.entitlements.auditLogRetentionDays.toLocaleString()} days`,
    ],
  ];

  return (
    <div className="flex flex-col gap-6">
      {notices}

      <section className="grid gap-4 md:grid-cols-3">
        <Metric
          icon={<Shield className="h-5 w-5" aria-hidden="true" />}
          label="Plan"
          value={titleCase(summary.planTier)}
        />
        <Metric
          icon={<BarChart3 className="h-5 w-5" aria-hidden="true" />}
          label="Daily usage"
          value={`${summary.usage.dailyAnalyses.used} / ${summary.usage.dailyAnalyses.limit}`}
        />
        <Metric
          icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
          label="Billing"
          value={subscription?.status ? titleCase(subscription.status) : "Free"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Panel
          icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
          title="Profile"
        >
          <dl className="grid gap-4 text-sm">
            <Detail label="Email" value={profile?.email ?? user.email ?? "Unknown"} />
            <Detail label="Name" value={profile?.display_name ?? "Not set"} />
            <Detail label="User ID" value={user.id} />
          </dl>
        </Panel>

        <Panel
          icon={<Shield className="h-5 w-5" aria-hidden="true" />}
          title="Entitlements"
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            {entitlementRows.map(([label, value]) => (
              <Detail key={label} label={label} value={value} />
            ))}
          </dl>
        </Panel>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel
          icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
          title="Billing"
        >
          <dl className="grid gap-4 text-sm">
            <Detail
              label="Provider"
              value={paymentProvider ? titleCase(paymentProvider) : "None"}
            />
            <Detail
              label="Subscription"
              value={subscriptionId ?? "No paid subscription"}
            />
            <Detail
              label="Renewal"
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
          <Link
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-md border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-sans text-sm text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10"
            href="/billing"
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Manage billing
          </Link>
        </Panel>

        <Panel
          icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
          title="Upgrade"
        >
          <p className="text-sm leading-6 text-[var(--muted)]">
            Pro and Studio subscriptions are handled through Razorpay Checkout.
          </p>
          <Link
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-md border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-sans text-sm text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10"
            href="/pricing"
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            View paid plans
          </Link>
        </Panel>

        <Panel
          icon={<Download className="h-5 w-5" aria-hidden="true" />}
          title="Data"
        >
          <div className="flex flex-col gap-3">
            <form action={requestDataExportAction}>
              <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[var(--border)] px-4 font-sans text-sm text-[var(--accent)] transition hover:border-[var(--accent-border)] hover:text-[var(--text)] sm:w-auto">
                <Download className="h-4 w-4" aria-hidden="true" />
                Request data export
              </button>
            </form>
            <form action={requestAccountDeletionAction}>
              <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-red-400/40 px-4 font-sans text-sm text-red-200 transition hover:border-red-400/70 sm:w-auto">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Request account deletion
              </button>
            </form>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[#15160f] p-5 shadow-[inset_0_1px_0_rgba(255,251,244,0.04)]">
      <div className="flex items-center gap-2 text-[var(--accent)]">
        {icon}
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          {label}
        </span>
      </div>
      <p className="mt-4 font-mono text-2xl text-[var(--text)]">{value}</p>
    </div>
  );
}

function Panel({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[#15160f] p-6 shadow-[inset_0_1px_0_rgba(255,251,244,0.04)]">
      <div className="mb-5 flex items-center gap-2.5 text-[var(--accent)]">
        {icon}
        <h2 className="font-sans text-base font-medium tracking-tight text-[var(--text)]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
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
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}
