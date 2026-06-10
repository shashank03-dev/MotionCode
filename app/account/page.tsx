import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CreditCard,
  Download,
  Shield,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";

import { getEntitlementSummary } from "@/lib/server/entitlements";
import { getCurrentUser } from "@/lib/supabase/server";

import {
  requestAccountDeletionAction,
  requestDataExportAction,
} from "./actions";

export const dynamic = "force-dynamic";

type AccountPageProps = {
  searchParams?: Promise<{
    billing?: string;
    request?: string;
  }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--bg)] px-6 py-10 text-[var(--text)]">
        <div className="mx-auto max-w-3xl border border-[var(--border)] bg-[#171812] p-8">
          <p className="font-mono text-xs uppercase text-[var(--muted)]">
            Account
          </p>
          <h1 className="mt-3 font-mono text-3xl">Sign in required</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--accent)]">
            Account settings are available after authentication.
          </p>
          <Link
            className="mt-6 inline-flex h-10 items-center gap-2 border border-[var(--accent-border)] px-4 font-mono text-sm text-[var(--text)]"
            href="/app"
          >
            Open app
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
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
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              MotionCode
            </Link>
            <h1 className="mt-3 font-mono text-4xl">Account</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center gap-2 border border-[var(--border)] px-4 font-mono text-sm text-[var(--accent)]"
              href="/pricing"
            >
              Plans
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              className="inline-flex h-10 items-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-mono text-sm text-[var(--text)]"
              href="/billing"
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Billing
            </Link>
          </div>
        </header>

        {resolvedSearchParams?.request ? (
          <div className="border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 py-3 font-mono text-sm text-[var(--text)]">
            Request received.
          </div>
        ) : null}

        {resolvedSearchParams?.billing === "razorpay" ? (
          <div className="border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 py-3 font-mono text-sm text-[var(--text)]">
            Razorpay billing changes are handled through support.
          </div>
        ) : null}

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
              className="mt-6 inline-flex h-10 items-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-mono text-sm text-[var(--text)]"
              href="/support"
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
              className="mt-6 inline-flex h-10 items-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-mono text-sm text-[var(--text)]"
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
                <button className="inline-flex h-10 w-full items-center justify-center gap-2 border border-[var(--border)] px-4 font-mono text-sm text-[var(--accent)] sm:w-auto">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Request data export
                </button>
              </form>
              <form action={requestAccountDeletionAction}>
                <button className="inline-flex h-10 w-full items-center justify-center gap-2 border border-red-400/40 px-4 font-mono text-sm text-red-200 sm:w-auto">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Request account deletion
                </button>
              </form>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-[var(--border)] bg-[#171812] p-5">
      <div className="flex items-center gap-2 text-[var(--accent)]">
        {icon}
        <span className="font-mono text-xs uppercase text-[var(--muted)]">
          {label}
        </span>
      </div>
      <p className="mt-4 font-mono text-2xl">{value}</p>
    </div>
  );
}

function Panel({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="border border-[var(--border)] bg-[#171812] p-6">
      <div className="mb-5 flex items-center gap-2 text-[var(--accent)]">
        {icon}
        <h2 className="font-mono text-lg">{title}</h2>
      </div>
      {children}
    </section>
  );
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
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}
