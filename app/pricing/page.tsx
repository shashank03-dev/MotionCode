import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

import { PLAN_ENTITLEMENTS, type PlanTier } from "@/lib/contracts/plans";

import { CheckoutButton } from "./CheckoutButton";

const PLAN_COPY: Record<
  PlanTier,
  {
    cta: string;
    description: string;
    price: string;
  }
> = {
  free: {
    cta: "Start free",
    description: "For testing the motion analysis workflow.",
    price: "$0",
  },
  pro: {
    cta: "Upgrade",
    description: "For individual production motion work.",
    price: "$19",
  },
  studio: {
    cta: "Upgrade",
    description: "For teams managing shared animation systems.",
    price: "$79",
  },
};

const FEATURE_LABELS: Array<[keyof typeof PLAN_ENTITLEMENTS.free, string]> = [
  ["dailyAnalyses", "daily analyses"],
  ["maxFramesPerAnalysis", "frames per analysis"],
  ["savedProjects", "saved projects"],
  ["teamSeats", "team seats"],
  ["workspaceCount", "workspaces"],
  ["auditLogRetentionDays", "audit log days"],
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              MotionCode
            </Link>
            <h1 className="mt-3 font-mono text-4xl">Pricing</h1>
          </div>
          <Link
            className="inline-flex h-10 items-center justify-center border border-[var(--border)] px-4 font-mono text-sm text-[var(--accent)]"
            href="/account"
          >
            Account
          </Link>
        </header>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {(["free", "pro", "studio"] as const).map((tier) => (
            <PlanColumn key={tier} tier={tier} />
          ))}
        </section>
      </div>
    </main>
  );
}

function PlanColumn({ tier }: { tier: PlanTier }) {
  const copy = PLAN_COPY[tier];
  const entitlements = PLAN_ENTITLEMENTS[tier];

  return (
    <section className="flex min-h-[540px] flex-col border border-[var(--border)] bg-[#171812] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase text-[var(--muted)]">
            {tier}
          </p>
          <h2 className="mt-3 font-mono text-3xl capitalize">{tier}</h2>
        </div>
        {tier === "studio" ? (
          <Sparkles className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
        ) : null}
      </div>
      <p className="mt-4 min-h-12 text-sm leading-6 text-[var(--accent)]">
        {copy.description}
      </p>
      <div className="mt-6 flex items-end gap-2">
        <span className="font-mono text-4xl">{copy.price}</span>
        <span className="pb-1 text-sm text-[var(--muted)]">/ month</span>
      </div>
      <div className="mt-6">
        {tier === "free" ? (
          <Link
            className="inline-flex h-10 w-full items-center justify-center border border-[var(--border)] px-4 font-mono text-sm text-[var(--accent)]"
            href="/app"
          >
            {copy.cta}
          </Link>
        ) : (
          <CheckoutButton planTier={tier} />
        )}
      </div>
      <ul className="mt-8 flex flex-1 flex-col gap-4 text-sm text-[var(--accent)]">
        {FEATURE_LABELS.map(([key, label]) => (
          <li key={key} className="flex items-start gap-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {formatFeatureValue(entitlements[key])} {label}
            </span>
          </li>
        ))}
        <li className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{entitlements.allowedModels.join(", ")}</span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{entitlements.supportPriority} support</span>
        </li>
      </ul>
    </section>
  );
}

function formatFeatureValue(value: unknown) {
  if (typeof value === "number") {
    return value.toLocaleString();
  }

  if (typeof value === "boolean") {
    return value ? "Includes" : "No";
  }

  return String(value);
}
