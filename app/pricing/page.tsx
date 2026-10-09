import Link from "next/link";

import { PageHero } from "@/components/chrono/page-hero";
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
    <div className="min-h-dvh bg-canvas text-ink">
      <SiteHeader />
      <main>
        <PageHero
          kicker="Pricing"
          title={
            <>
              Access tiers for <span className="serif-em">motion analysis.</span>
            </>
          }
          lede="Start free, then upgrade through Razorpay when production work needs more analyses, saved projects, or shared workspace access."
        />

        <section className="container-page py-16 sm:py-24">
          <div className="grid border-t border-hairline-strong lg:grid-cols-3">
            {TIERS.map((tier, index) => (
              <PlanColumn key={tier} tier={tier} index={index} />
            ))}
          </div>

          <p className="mt-12 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
            Prices in USD, billed monthly through Razorpay. Cancel anytime from
            your account.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function PlanColumn({ tier, index }: { tier: PlanTier; index: number }) {
  const copy = PLAN_COPY[tier];
  const entitlements = PLAN_ENTITLEMENTS[tier];
  const isFeatured = tier === "pro";

  return (
    <article
      className={cn(
        "relative flex flex-col border-b border-hairline py-10 lg:border-b-0 lg:px-8 lg:py-12",
        index > 0 && "lg:border-l",
        index === 0 && "lg:pl-0",
        isFeatured && "lg:bg-bone/[0.025]",
      )}
    >
      {isFeatured ? (
        <span className="absolute inset-x-0 top-0 h-px bg-accent lg:-top-px" aria-hidden />
      ) : null}

      <div className="flex items-center justify-between">
        <h3 className="text-[1.6rem] tracking-[-0.04em]">{PLAN_LABELS[tier]}</h3>
        <span
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.16em]",
            isFeatured ? "text-accent" : "text-ink-3",
          )}
        >
          {isFeatured ? "most used" : String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <p className="mt-2 text-[15px] leading-6 text-ink-2">{copy.description}</p>

      <div className="mt-10 flex items-baseline gap-2">
        <span className="text-[clamp(3.5rem,6vw,5rem)] font-medium leading-none tracking-[-0.06em]">
          {copy.price}
        </span>
        <span className="font-mono text-[12px] text-ink-3">{copy.period}</span>
      </div>

      <p className="eyebrow mt-10">What you will get</p>
      <ul className="mt-3 flex-1 border-t border-hairline">
        {FEATURE_LABELS.map(([key, label]) => (
          <li
            key={key}
            className="flex items-center justify-between gap-3 border-b border-hairline py-3 text-[14.5px]"
          >
            <span className="text-ink-2">{label}</span>
            <span className="font-mono text-[12.5px] tabular-nums text-ink">
              {formatFeatureValue(entitlements[key])}
            </span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3 border-b border-hairline py-3 text-[14.5px]">
          <span className="text-ink-2">support</span>
          <span className="font-mono text-[12.5px] text-ink">{entitlements.supportPriority}</span>
        </li>
      </ul>

      {tier === "free" ? (
        <Link
          href="/app"
          className="mt-10 inline-flex h-[52px] w-full items-center justify-center rounded-full text-[15px] font-medium text-ink shadow-[inset_0_0_0_1px_var(--border-strong)] transition hover:shadow-[inset_0_0_0_1px_var(--text)] active:scale-[0.98]"
        >
          {copy.cta} →
        </Link>
      ) : (
        <div className="mt-10">
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
