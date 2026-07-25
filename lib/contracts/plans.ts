export const PLAN_TIERS = ["free", "pro", "studio"] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];

// User-facing display names. The internal tier id `studio` is presented as
// "Team" everywhere in the UI — keep this map the single source of truth so a
// future rename never has to touch scattered copy.
export const PLAN_LABELS: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  studio: "Team",
};

// Sentinel for quotas advertised as "Unlimited". It is a real, high fair-use
// ceiling (not Infinity) so enforcement stays bounded and JSON/DB-safe, while
// the UI renders any quota at or above it as "Unlimited".
export const UNLIMITED_QUOTA = 100_000;

export function isUnlimitedQuota(value: number): boolean {
  return value >= UNLIMITED_QUOTA;
}

// Formats a numeric quota for display: "Unlimited" past the ceiling, otherwise
// a locale-grouped number (e.g. "2,000").
export function formatQuota(value: number): string {
  return isUnlimitedQuota(value) ? "Unlimited" : value.toLocaleString();
}

export type PlanEntitlements = {
  tier: PlanTier;
  dailyAnalyses: number;
  maxFramesPerAnalysis: number;
  maxUploadBytes: number;
  allowedModels: Array<"gemini-2.5-flash" | "gemini-2.5-pro">;
  savedProjects: number;
  shareLinks: boolean;
  comments: boolean;
  teamSeats: number;
  workspaceCount: number;
  projectVersioning: boolean;
  auditLogRetentionDays: number;
  supportPriority: "community" | "standard" | "priority";
};

export const PLAN_ENTITLEMENTS: Record<PlanTier, PlanEntitlements> = {
  free: {
    tier: "free",
    dailyAnalyses: 1,
    maxFramesPerAnalysis: 6,
    maxUploadBytes: 25 * 1024 * 1024,
    allowedModels: ["gemini-2.5-flash"],
    savedProjects: 3,
    shareLinks: false,
    comments: false,
    teamSeats: 1,
    workspaceCount: 0,
    projectVersioning: false,
    auditLogRetentionDays: 7,
    supportPriority: "community",
  },
  pro: {
    tier: "pro",
    // Marketed as "Unlimited analyses" / "Unlimited workspaces" — enforced as a
    // high fair-use ceiling via UNLIMITED_QUOTA.
    dailyAnalyses: UNLIMITED_QUOTA,
    maxFramesPerAnalysis: 12,
    maxUploadBytes: 100 * 1024 * 1024,
    allowedModels: ["gemini-2.5-flash", "gemini-2.5-pro"],
    savedProjects: 250,
    shareLinks: true,
    comments: false,
    teamSeats: 1,
    workspaceCount: UNLIMITED_QUOTA,
    projectVersioning: true,
    auditLogRetentionDays: 30,
    supportPriority: "standard",
  },
  studio: {
    tier: "studio",
    // "Team" tier — everything in Pro, so it inherits the same unlimited
    // analyses / workspaces ceiling.
    dailyAnalyses: UNLIMITED_QUOTA,
    maxFramesPerAnalysis: 16,
    maxUploadBytes: 250 * 1024 * 1024,
    allowedModels: ["gemini-2.5-flash", "gemini-2.5-pro"],
    savedProjects: 2000,
    shareLinks: true,
    comments: true,
    teamSeats: 5,
    workspaceCount: UNLIMITED_QUOTA,
    projectVersioning: true,
    auditLogRetentionDays: 180,
    supportPriority: "priority",
  },
};
