export const PLAN_TIERS = ["free", "pro", "studio"] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];

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
    savedProjects: 5,
    shareLinks: false,
    comments: false,
    teamSeats: 1,
    workspaceCount: 1,
    projectVersioning: false,
    auditLogRetentionDays: 7,
    supportPriority: "community",
  },
  pro: {
    tier: "pro",
    dailyAnalyses: 100,
    maxFramesPerAnalysis: 12,
    maxUploadBytes: 100 * 1024 * 1024,
    allowedModels: ["gemini-2.5-flash", "gemini-2.5-pro"],
    savedProjects: 250,
    shareLinks: true,
    comments: false,
    teamSeats: 1,
    workspaceCount: 3,
    projectVersioning: true,
    auditLogRetentionDays: 30,
    supportPriority: "standard",
  },
  studio: {
    tier: "studio",
    dailyAnalyses: 500,
    maxFramesPerAnalysis: 16,
    maxUploadBytes: 250 * 1024 * 1024,
    allowedModels: ["gemini-2.5-flash", "gemini-2.5-pro"],
    savedProjects: 2000,
    shareLinks: true,
    comments: true,
    teamSeats: 5,
    workspaceCount: 10,
    projectVersioning: true,
    auditLogRetentionDays: 180,
    supportPriority: "priority",
  },
};
