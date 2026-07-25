import Link from "next/link";
import { Check } from "lucide-react";

import { SiteFooter, SiteHeader } from "@/components/marketing";
import {
  formatQuota,
  PLAN_ENTITLEMENTS,
  PLAN_LABELS,
  type PlanTier,
} from "@/lib/contracts/plans";
import { cn } from "@/lib/utils";

import { CheckoutButton } from "./CheckoutButton";

export const dynamic = "force-dynamic";

const PLAN_COPY: Record<
  PlanTier,
  {
    cta: string;
    description: string;
    period: string;
    price: string;
  }
> = {
  free: {
    cta: "Start free",
    description: "For testing the motion analysis workflow.",
    period: "preview",
    price: "$0",
  },
  pro: {
    cta: "Pay with Razorpay",
    description: "For individual production motion work.",
    period: "/ month",
    price: "$18",
  },
  studio: {
    cta: "Pay with Razorpay",
    description: "For teams managing shared animation systems.",
    period: "/ month",
    price: "$49",
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

const TIERS: PlanTier[] = ["free", "pro", "studio"];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SiteHeader />
      <main>
        <section className="container-page py-20 sm:py-24">
          <header className="mx-auto max-w-2xl text-center">
            <div className="eyebrow mb-4">Pricing</div>
            <h1 className="font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
              Access tiers for motion analysis.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-ink-2 sm:text-lg">
              Start free, then upgrade through Razorpay when production work needs
              more analyses, saved projects, or shared workspace access.
            </p>
          </header>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {TIERS.map((tier) => (
              <PlanColumn key={tier} tier={tier} />
            ))}
          </div>

          <p className="mt-10 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
            Prices in USD, billed monthly through Razorpay. Cancel anytime from
            your account.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function PlanColumn({ tier }: { tier: PlanTier }) {
  const copy = PLAN_COPY[tier];
  const entitlements = PLAN_ENTITLEMENTS[tier];
  const isFeatured = tier === "pro";

  return (
    <article
      className={cn(
        "glass-card relative flex flex-col rounded-2xl p-7",
        isFeatured ? "!border-[var(--accent-border)] shadow-glow" : "",
      )}
    >
      {isFeatured ? (
        <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-black">
          most used
        </span>
      ) : null}

      <h3 className="text-lg font-medium tracking-tight">{PLAN_LABELS[tier]}</h3>
      <p className="mt-2 text-[14px] leading-6 text-ink-2">{copy.description}</p>

      <div className="mt-5 flex items-end gap-1.5">
        <span className="font-display text-5xl tracking-tight">{copy.price}</span>
        <span className="mb-1.5 font-mono text-[12px] text-ink-3">
          {copy.period}
        </span>
      </div>

      <p className="mt-7 eyebrow">What you will get</p>
      <ul className="mt-4 flex-1 space-y-3">
        {FEATURE_LABELS.map(([key, label]) => (
          <li key={key} className="flex items-start gap-2.5 text-[14px]">
            <Check
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                isFeatured ? "text-accent" : "text-ink-3",
              )}
              strokeWidth={2}
            />
            <span className="text-ink-2">
              {formatFeatureValue(entitlements[key])} {label}
            </span>
          </li>
        ))}
        <li className="flex items-start gap-2.5 text-[14px]">
          <Check
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              isFeatured ? "text-accent" : "text-ink-3",
            )}
            strokeWidth={2}
          />
          <span className="text-ink-2">{entitlements.supportPriority} support</span>
        </li>
      </ul>

      {tier === "free" ? (
        <Link
          href="/app"
          className="mt-7 inline-flex h-11 w-full items-center justify-center rounded-full border border-hairline-strong text-sm font-medium text-ink transition hover:bg-white/[0.04] active:scale-[0.98]"
        >
          {copy.cta} →
        </Link>
      ) : (
        <div className="mt-7">
          <CheckoutButton planTier={tier} />
        </div>
      )}
    </article>
  );
}

function formatFeatureValue(value: unknown) {
  if (typeof value === "number") {
    return formatQuota(value);
  }

  if (typeof value === "boolean") {
    return value ? "Includes" : "No";
  }

  return String(value);
}
