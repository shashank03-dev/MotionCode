import Link from "next/link";

import { SiteFooter, SiteHeader } from "@/components/marketing";
import { PLAN_ENTITLEMENTS, type PlanTier } from "@/lib/contracts/plans";

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
    price: "₹0",
  },
  pro: {
    cta: "Pay with Razorpay",
    description: "For individual production motion work.",
    period: "/ month",
    price: "₹100",
  },
  studio: {
    cta: "Pay with Razorpay",
    description: "For teams managing shared animation systems.",
    period: "/ month",
    price: "₹500",
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <SiteHeader />
      <main>
        <section className="motioncode-pricing-section pricing-page">
          <header className="pricing-page-head">
            <div className="pricing-page-head-lede">
              <div className="motioncode-pricing-kicker">Pricing</div>
              <h1 className="pricing-page-title">
                Access tiers for motion analysis.
              </h1>
            </div>
            <p className="pricing-page-sub">
              Start free, then upgrade through Razorpay when production work needs
              more analyses, saved projects, or shared workspace access.
            </p>
          </header>

          <div className="motioncode-pricing-grid" data-static="true">
            {TIERS.map((tier) => (
              <PlanColumn key={tier} tier={tier} />
            ))}
          </div>

          <p className="motioncode-pricing-fineprint">
            Prices in INR, billed monthly through Razorpay. Cancel anytime from
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
      className={`motioncode-pricing-card ${isFeatured ? "motioncode-pricing-card-featured" : ""}`}
    >
      <div className="motioncode-pricing-card-top">
        <div>
          <h3 className="capitalize">{tier}</h3>
          <p>{copy.description}</p>
        </div>
        {isFeatured ? (
          <span className="motioncode-pricing-badge">most used</span>
        ) : null}
      </div>

      <div className="motioncode-pricing-rate">
        <span className="motioncode-pricing-price">{copy.price}</span>
        <span>{copy.period}</span>
      </div>

      <ul className="motioncode-pricing-features">
        {FEATURE_LABELS.map(([key, label]) => (
          <li key={key}>
            {formatFeatureValue(entitlements[key])} {label}
          </li>
        ))}
        <li>{entitlements.supportPriority} support</li>
      </ul>

      {tier === "free" ? (
        <Link href="/app" className="motioncode-pricing-cta">
          {copy.cta} →
        </Link>
      ) : (
        <div className="motioncode-pricing-checkout mt-auto [&_button]:!h-11 [&_button]:!w-full [&_button]:!rounded-lg [&_button]:!border [&_button]:!border-[#00ff88]/60 [&_button]:!bg-[#00ff88]/10 [&_button]:!font-mono [&_button]:!text-xs [&_button]:!font-bold [&_button]:!text-[#00ff88] [&_button:hover]:!border-[#00ff88] [&_button:hover]:!bg-[#00ff88]/15 [&_p]:!mt-2 [&_p]:!text-[11px] [&_p]:!text-[#ffd1d1]">
          <CheckoutButton planTier={tier} />
        </div>
      )}
    </article>
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
