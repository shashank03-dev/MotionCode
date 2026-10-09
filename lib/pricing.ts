import {
  PLAN_ENTITLEMENTS,
  PLAN_LABELS,
  PLAN_TIERS,
  formatQuota,
  isUnlimitedQuota,
  type PlanEntitlements,
  type PlanTier,
} from "@/lib/contracts/plans";

/**
 * Presentation model for pricing, shared by the landing section and /pricing.
 * Every number and every feature line is derived from PLAN_ENTITLEMENTS so the
 * marketing copy can never promise something the product doesn't enforce.
 */

export type PricingTier = {
  tier: PlanTier;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  /** Frames sampled per analysis — drawn as the tier's exposure strip. */
  frames: number;
  /** Short, differentiating lines for the tier cards. */
  highlights: string[];
  /** "Everything in X, plus" lead-in for paid tiers. */
  inherits?: string;
  featured: boolean;
  cta: { label: string; href: string };
};

const COPY: Record<PlanTier, Pick<PricingTier, "price" | "cadence" | "blurb">> = {
  free: {
    price: "$0",
    cadence: "/forever",
    blurb: "Try the pipeline on a real reference.",
  },
  pro: {
    price: "$18",
    cadence: "/month",
    blurb: "For designers and engineers shipping motion daily.",
  },
  studio: {
    price: "$49",
    cadence: "/month",
    blurb: "For teams keeping a shared motion language.",
  },
};

export function formatBytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${formatQuota(n)} ${n === 1 ? one : many}`;

function analysesLine(e: PlanEntitlements) {
  return isUnlimitedQuota(e.dailyAnalyses)
    ? "Unlimited analyses"
    : `${plural(e.dailyAnalyses, "analysis", "analyses")} a day`;
}

function highlightsFor(tier: PlanTier): string[] {
  const e = PLAN_ENTITLEMENTS[tier];
  switch (tier) {
    case "free":
      return [
        analysesLine(e),
        `${e.maxFramesPerAnalysis} frames per analysis`,
        "CSS, GSAP and Framer Motion output",
        "Read-only code studio — preview and copy",
        plural(e.savedProjects, "saved project"),
      ];
    case "pro":
      return [
        analysesLine(e),
        `${e.maxFramesPerAnalysis} frames per analysis`,
        "Editable code studio with export",
        "Gemini 2.5 Pro analysis",
        "Unlimited workspaces",
        "Version history and share links",
      ];
    case "studio":
      return [
        `${e.teamSeats} team seats`,
        `${e.maxFramesPerAnalysis} frames per analysis`,
        "Comments on shared projects",
        `${formatBytes(e.maxUploadBytes)} uploads`,
        `${e.auditLogRetentionDays}-day audit log`,
        "Priority support",
      ];
  }
}

export const PRICING_TIERS: PricingTier[] = PLAN_TIERS.map((tier) => ({
  tier,
  name: PLAN_LABELS[tier],
  ...COPY[tier],
  frames: PLAN_ENTITLEMENTS[tier].maxFramesPerAnalysis,
  highlights: highlightsFor(tier),
  inherits: tier === "studio" ? "Everything in Pro, plus" : undefined,
  featured: tier === "pro",
  cta:
    tier === "free"
      ? { label: "Start free", href: "/app" }
      : { label: `Go ${PLAN_LABELS[tier]}`, href: "/pricing" },
}));

/** The most frames any tier samples — the scale every exposure strip shares. */
export const MAX_FRAMES = Math.max(...PRICING_TIERS.map((t) => t.frames));

export type ComparisonValue = string | boolean;
export type ComparisonRow = { label: string; hint?: string; values: Record<PlanTier, ComparisonValue> };
export type ComparisonGroup = { title: string; rows: ComparisonRow[] };

const each = (pick: (e: PlanEntitlements) => ComparisonValue) =>
  Object.fromEntries(PLAN_TIERS.map((t) => [t, pick(PLAN_ENTITLEMENTS[t])])) as Record<
    PlanTier,
    ComparisonValue
  >;

export const COMPARISON: ComparisonGroup[] = [
  {
    title: "Analysis",
    rows: [
      {
        label: "Analyses",
        values: each((e) => (isUnlimitedQuota(e.dailyAnalyses) ? "Unlimited" : `${e.dailyAnalyses} / day`)),
      },
      { label: "Frames per analysis", values: each((e) => String(e.maxFramesPerAnalysis)) },
      { label: "Max upload", values: each((e) => formatBytes(e.maxUploadBytes)) },
      {
        label: "Analysis model",
        values: each((e) => (e.allowedModels.includes("gemini-2.5-pro") ? "Flash + Pro" : "Gemini 2.5 Flash")),
      },
    ],
  },
  {
    title: "Output",
    rows: [
      { label: "CSS, GSAP and Framer Motion code", values: each(() => true) },
      { label: "Reduced-motion fallback", values: each(() => true) },
      {
        label: "Code studio",
        hint: "Free can preview and copy; paid plans edit and export.",
        values: { free: "Read-only", pro: "Edit + export", studio: "Edit + export" },
      },
    ],
  },
  {
    title: "Workspace",
    rows: [
      { label: "Saved projects", values: each((e) => formatQuota(e.savedProjects)) },
      { label: "Workspaces", values: each((e) => (e.workspaceCount === 0 ? false : formatQuota(e.workspaceCount))) },
      { label: "Version history", values: each((e) => e.projectVersioning) },
      { label: "Share links", values: each((e) => e.shareLinks) },
    ],
  },
  {
    title: "Team",
    rows: [
      { label: "Seats", values: each((e) => String(e.teamSeats)) },
      { label: "Comments", values: each((e) => e.comments) },
      { label: "Audit log", values: each((e) => `${e.auditLogRetentionDays} days`) },
      {
        label: "Support",
        values: each((e) => e.supportPriority[0].toUpperCase() + e.supportPriority.slice(1)),
      },
    ],
  },
];

export const PRICING_FAQ: { q: string; a: string; link?: { label: string; href: string } }[] = [
  {
    q: "What counts as an analysis?",
    a: "One run of the analyzer on an uploaded reference — frames extracted, motion read, spec and code generated. Opening a result you've already saved doesn't use one.",
  },
  {
    q: "How does billing work?",
    a: "Paid plans are monthly subscriptions in USD, processed by Razorpay. You can cancel any time from your account; access continues to the end of the period you've paid for.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrade from Free at any time, or move between Pro and Team from the billing page.",
  },
  {
    q: "Do you offer refunds?",
    a: "The refund policy covers when and how a payment can be refunded.",
    link: { label: "Read the refund policy", href: "/refunds" },
  },
];
