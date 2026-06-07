import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

import { SiteFooter, SiteHeader } from "@/components/marketing";
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
    <div className="min-h-screen bg-[#080808] text-[#fffbf4]">
      <SiteHeader />
      <main>
        <section className="border-b border-[#1a1a1a]">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00ff88]">
                {"// pricing"}
              </p>
              <h1 className="mt-4 font-mono text-4xl font-bold leading-tight sm:text-5xl">
                Access tiers for motion analysis.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#565449] sm:text-lg">
                Start with the free workflow, then upgrade when production work
                needs more analyses, saved projects, or shared workspace access.
              </p>
            </div>
            <Link
              className="inline-flex h-11 w-fit items-center justify-center border border-[#1a1a1a] px-5 font-mono text-xs font-bold text-[#00ff88] transition-colors hover:border-[#00ff88]/60 hover:bg-[#00ff88]/10"
              href="/account"
            >
              Account
            </Link>
          </div>
        </section>

        <section className="border-b border-[#1a1a1a] bg-[#11120d]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-4 lg:grid-cols-3">
              {(["free", "pro", "studio"] as const).map((tier) => (
                <PlanColumn key={tier} tier={tier} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function PlanColumn({ tier }: { tier: PlanTier }) {
  const copy = PLAN_COPY[tier];
  const entitlements = PLAN_ENTITLEMENTS[tier];
  const isFeatured = tier === "studio";

  return (
    <section
      className={`flex min-h-[540px] flex-col border bg-[#080808] p-6 transition-colors ${
        isFeatured
          ? "border-[#00ff88]/70 shadow-[0_0_0_1px_rgba(0,255,136,0.15)]"
          : "border-[#1a1a1a] hover:border-[#00ff88]/50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#565449]">
            {tier}
          </p>
          <h2 className="mt-3 font-mono text-3xl capitalize text-[#fffbf4]">
            {tier}
          </h2>
        </div>
        {isFeatured ? (
          <Sparkles className="h-5 w-5 text-[#00ff88]" aria-hidden="true" />
        ) : null}
      </div>
      <p className="mt-4 min-h-12 text-sm leading-6 text-[#d8cfbc]/70">
        {copy.description}
      </p>
      <div className="mt-6 flex items-end gap-2">
        <span className="font-mono text-4xl text-[#fffbf4]">{copy.price}</span>
        <span className="pb-1 text-sm text-[#565449]">/ month</span>
      </div>
      <div className="mt-6">
        {tier === "free" ? (
          <Link
            className="inline-flex h-11 w-full items-center justify-center border border-[#00ff88] bg-[#00ff88] px-4 font-mono text-xs font-bold text-[#080808] transition-opacity hover:opacity-90"
            href="/app"
          >
            {copy.cta}
          </Link>
        ) : (
          <div className="[&_button]:!h-11 [&_button]:!w-full [&_button]:!rounded-none [&_button]:!border-[#00ff88]/60 [&_button]:!bg-[#00ff88]/10 [&_button]:!font-mono [&_button]:!text-xs [&_button]:!font-bold [&_button]:!text-[#00ff88] [&_button:hover]:!bg-[#00ff88]/15 [&_p]:!text-[#ffd1d1]">
            <CheckoutButton planTier={tier} />
          </div>
        )}
      </div>
      <ul className="mt-8 flex flex-1 flex-col gap-4 text-sm text-[#d8cfbc]/75">
        {FEATURE_LABELS.map(([key, label]) => (
          <li key={key} className="flex items-start gap-3">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-[#00ff88]"
              aria-hidden="true"
            />
            <span>
              {formatFeatureValue(entitlements[key])} {label}
            </span>
          </li>
        ))}
        <li className="flex items-start gap-3">
          <Check
            className="mt-0.5 h-4 w-4 shrink-0 text-[#00ff88]"
            aria-hidden="true"
          />
          <span>{entitlements.allowedModels.join(", ")}</span>
        </li>
        <li className="flex items-start gap-3">
          <Check
            className="mt-0.5 h-4 w-4 shrink-0 text-[#00ff88]"
            aria-hidden="true"
          />
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
