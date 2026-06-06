import { createHash, randomBytes } from "node:crypto";

import type {
  AnalysisResult,
  GeneratedOutput,
  MotionSpec,
  OutputFramework,
} from "@/lib/contracts/motion";
import { PLAN_TIERS, type PlanTier } from "@/lib/contracts/plans";
import { createTrustedSupabaseServerClient } from "@/lib/server/audit";
import { ApiError } from "@/lib/server/apiErrors";
import type { Json } from "@/types/database";

export type ShareAccessMode = "read" | "comment";

export type ShareLinkSummary = {
  id: string;
  projectId: string;
  ownerId: string;
  accessMode: ShareAccessMode;
  includeComments: boolean;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type PublicProjectComment = {
  id: string;
  authorId: string;
  body: string;
  resolvedAt: string | null;
  createdAt: string;
};

export type SharedProject = {
  share: ShareLinkSummary;
  project: {
    id: string;
    title: string;
    description: string | null;
    workspaceId: string;
    workspaceName: string;
  };
  analysis: AnalysisResult | null;
  comments: PublicProjectComment[];
  commentsIncluded: boolean;
};

export type CreateShareLinkInput = {
  projectId: string;
  userId: string;
  accessMode?: ShareAccessMode;
  includeComments?: boolean;
  expiresAt?: string | null;
  now?: Date;
};

export type RevokeShareLinkInput = {
  shareLinkId: string;
  userId: string;
  now?: Date;
};

type QueryError = { message?: string } | null;

type QueryResult<T> = {
  data: T;
  error: QueryError;
};

type QueryBuilder<T extends Record<string, unknown> = Record<string, unknown>> =
  PromiseLike<QueryResult<T[] | null>> & {
    eq: (column: string, value: unknown) => QueryBuilder<T>;
    gt: (column: string, value: unknown) => QueryBuilder<T>;
    is: (column: string, value: unknown) => QueryBuilder<T>;
    limit: (count: number) => QueryBuilder<T>;
    maybeSingle: () => PromiseLike<QueryResult<T | null>>;
    order: (
      column: string,
      options?: { ascending?: boolean },
    ) => QueryBuilder<T>;
    single: () => PromiseLike<QueryResult<T>>;
  };

type InsertBuilder<T extends Record<string, unknown> = Record<string, unknown>> = {
  select: (columns?: string) => QueryBuilder<T>;
};

type TableBuilder<T extends Record<string, unknown> = Record<string, unknown>> = {
  insert: (values: Record<string, unknown>) => InsertBuilder<T>;
  select: (columns?: string) => QueryBuilder<T>;
  update: (values: Record<string, unknown>) => QueryBuilder<T>;
};

type ShareDataClient = {
  from: (table: string) => TableBuilder;
};

type ShareLinkRow = {
  id: string;
  project_id: string;
  owner_id: string;
  token_hash: string;
  access_mode: ShareAccessMode;
  include_comments: boolean;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

type ProjectRow = {
  id: string;
  workspace_id: string;
  owner_id: string;
  title: string;
  description: string | null;
  latest_version_id: string | null;
};

type WorkspaceRow = {
  id: string;
  owner_id: string;
  name: string;
  plan_tier: PlanTier;
};

type ProjectVersionRow = {
  id: string;
  project_id: string;
  created_by: string;
  version_number: number;
  label: string | null;
  motion_spec: Json;
  created_at: string;
};

type AnalysisRow = {
  id: string;
  project_id: string;
  version_id: string | null;
  model: AnalysisResult["model"];
  frame_count: number;
  created_at: string;
};

type GeneratedOutputRow = {
  framework: OutputFramework;
  code: string;
  dependencies: Json;
  setup_notes: Json;
  warnings: Json;
};

type ProjectCommentRow = {
  id: string;
  project_id: string;
  author_id: string;
  body: string;
  resolved_at: string | null;
  created_at: string;
};

type ShareLinkOptions = {
  client?: ShareDataClient;
};

export function generateShareToken() {
  return randomBytes(32).toString("base64url");
}

export function hashShareToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createProjectShareLink(
  input: CreateShareLinkInput,
  options: ShareLinkOptions = {},
) {
  const client = shareClient(options.client);
  const now = input.now ?? new Date();
  const project = await getProject(client, input.projectId);
  const workspace = await getWorkspace(client, project.workspace_id);

  await assertCanManageProjectShare(client, input.userId, project, workspace);

  if (workspace.plan_tier === "free") {
    throw new ApiError(
      "BILLING_REQUIRED",
      "Free workspaces cannot create share links.",
    );
  }

  const requestedMode = input.accessMode ?? "read";
  if (requestedMode === "comment" && workspace.plan_tier !== "studio") {
    throw new ApiError(
      "BILLING_REQUIRED",
      "Comment share links require a Studio workspace.",
    );
  }

  const accessMode: ShareAccessMode =
    workspace.plan_tier === "studio" ? requestedMode : "read";
  const includeComments =
    workspace.plan_tier === "studio"
      ? input.includeComments ?? accessMode === "comment"
      : false;

  if (input.includeComments && workspace.plan_tier !== "studio") {
    throw new ApiError(
      "BILLING_REQUIRED",
      "Public comment history requires a Studio workspace.",
    );
  }

  const expiresAt = normalizeFutureExpiration(input.expiresAt, now);
  const token = generateShareToken();
  const inserted = await client
    .from("share_links")
    .insert({
      access_mode: accessMode,
      expires_at: expiresAt,
      include_comments: includeComments,
      owner_id: input.userId,
      project_id: input.projectId,
      token_hash: hashShareToken(token),
    })
    .select("*")
    .single();

  if (inserted.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to create share link.");
  }

  return {
    link: toShareLinkSummary(inserted.data as ShareLinkRow),
    token,
  };
}

export async function revokeProjectShareLink(
  input: RevokeShareLinkInput,
  options: ShareLinkOptions = {},
) {
  const client = shareClient(options.client);
  const now = input.now ?? new Date();
  const link = await getShareLinkById(client, input.shareLinkId);
  const project = await getProject(client, link.project_id);
  const workspace = await getWorkspace(client, project.workspace_id);

  await assertCanManageProjectShare(client, input.userId, project, workspace);

  const revokedAt = link.revoked_at ?? now.toISOString();
  const updated = await client
    .from("share_links")
    .update({ revoked_at: revokedAt })
    .eq("id", input.shareLinkId);

  if (updated.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to revoke share link.");
  }

  return {
    ...toShareLinkSummary(link),
    revokedAt,
  };
}

export async function resolveSharedProjectByToken(
  token: string,
  options: ShareLinkOptions = {},
): Promise<SharedProject | null> {
  const client = shareClient(options.client);
  const link = await findShareLinkByTokenHash(client, hashShareToken(token));

  if (!link || isInactiveShareLink(link)) {
    return null;
  }

  const project = await findProject(client, link.project_id);
  if (!project) {
    return null;
  }

  const workspace = await findWorkspace(client, project.workspace_id);
  if (!workspace) {
    return null;
  }

  const version = await resolveProjectVersion(client, project);
  const analysis = version
    ? await resolveAnalysisResult(client, project, version)
    : null;
  const comments = link.include_comments
    ? await getProjectComments(client, project.id)
    : [];

  return {
    analysis,
    comments,
    commentsIncluded: link.include_comments,
    project: {
      description: project.description,
      id: project.id,
      title: project.title,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
    },
    share: toShareLinkSummary(link),
  };
}

function shareClient(client?: ShareDataClient): ShareDataClient {
  return client ?? (createTrustedSupabaseServerClient() as unknown as ShareDataClient);
}

async function getProject(client: ShareDataClient, projectId: string) {
  const project = await findProject(client, projectId);
  if (!project) {
    throw new ApiError("NOT_FOUND", "Project not found.");
  }

  return project;
}

async function findProject(client: ShareDataClient, projectId: string) {
  const result = await client
    .from("projects")
    .select("id, workspace_id, owner_id, title, description, latest_version_id")
    .eq("id", projectId)
    .maybeSingle();

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read project.");
  }

  return result.data as ProjectRow | null;
}

async function getWorkspace(client: ShareDataClient, workspaceId: string) {
  const workspace = await findWorkspace(client, workspaceId);
  if (!workspace) {
    throw new ApiError("NOT_FOUND", "Workspace not found.");
  }

  return workspace;
}

async function findWorkspace(client: ShareDataClient, workspaceId: string) {
  const result = await client
    .from("workspaces")
    .select("id, owner_id, name, plan_tier")
    .eq("id", workspaceId)
    .maybeSingle();

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read workspace.");
  }

  const row = result.data as WorkspaceRow | null;
  if (!row || !PLAN_TIERS.includes(row.plan_tier)) {
    return null;
  }

  return row;
}

async function getShareLinkById(client: ShareDataClient, shareLinkId: string) {
  const result = await client
    .from("share_links")
    .select("*")
    .eq("id", shareLinkId)
    .maybeSingle();

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read share link.");
  }

  if (!result.data) {
    throw new ApiError("NOT_FOUND", "Share link not found.");
  }

  return result.data as ShareLinkRow;
}

async function findShareLinkByTokenHash(
  client: ShareDataClient,
  tokenHash: string,
) {
  const result = await client
    .from("share_links")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read share link.");
  }

  return result.data as ShareLinkRow | null;
}

async function assertCanManageProjectShare(
  client: ShareDataClient,
  userId: string,
  project: ProjectRow,
  workspace: WorkspaceRow,
) {
  if (project.owner_id === userId || workspace.owner_id === userId) {
    return;
  }

  if (workspace.plan_tier !== "studio") {
    throw new ApiError("FORBIDDEN", "You cannot manage this project share.");
  }

  const isAdmin =
    (await hasMembershipRole(client, "workspace_members", workspace.id, userId, "admin")) ||
    (await hasMembershipRole(client, "team_members", workspace.id, userId, "admin"));

  if (!isAdmin) {
    throw new ApiError("FORBIDDEN", "You cannot manage this project share.");
  }
}

async function hasMembershipRole(
  client: ShareDataClient,
  table: "workspace_members" | "team_members",
  workspaceId: string,
  userId: string,
  role: "admin" | "member",
) {
  const result = await client
    .from(table)
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("role", role)
    .limit(1);

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read workspace membership.");
  }

  return Boolean(result.data?.length);
}

async function resolveProjectVersion(
  client: ShareDataClient,
  project: ProjectRow,
) {
  if (project.latest_version_id) {
    const result = await client
      .from("project_versions")
      .select("*")
      .eq("id", project.latest_version_id)
      .eq("project_id", project.id)
      .maybeSingle();

    if (result.error) {
      throw new ApiError("INTERNAL_ERROR", "Failed to read project version.");
    }

    if (result.data) {
      return result.data as ProjectVersionRow;
    }
  }

  const latest = await client
    .from("project_versions")
    .select("*")
    .eq("project_id", project.id)
    .order("version_number", { ascending: false })
    .limit(1);

  if (latest.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read project versions.");
  }

  return (latest.data?.[0] as ProjectVersionRow | undefined) ?? null;
}

async function resolveAnalysisResult(
  client: ShareDataClient,
  project: ProjectRow,
  version: ProjectVersionRow,
): Promise<AnalysisResult | null> {
  const analysisResult = await client
    .from("analyses")
    .select("id, project_id, version_id, model, frame_count, created_at")
    .eq("project_id", project.id)
    .eq("version_id", version.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (analysisResult.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read analysis.");
  }

  const analysis = (analysisResult.data?.[0] as AnalysisRow | undefined) ?? null;
  const outputRows = analysis
    ? await getGeneratedOutputsForAnalysis(client, analysis.id)
    : await getGeneratedOutputsForProject(client, project.id);

  return {
    assetId: "",
    createdAt: analysis?.created_at ?? version.created_at,
    frameCount: analysis?.frame_count ?? 0,
    id: analysis?.id ?? version.id,
    model: analysis?.model ?? "gemini-2.5-flash",
    outputs: outputRows.map(toGeneratedOutput),
    projectId: project.id,
    spec: toMotionSpec(version.motion_spec),
    versionId: version.id,
  };
}

async function getGeneratedOutputsForAnalysis(
  client: ShareDataClient,
  analysisId: string,
) {
  const result = await client
    .from("generated_outputs")
    .select("framework, code, dependencies, setup_notes, warnings")
    .eq("analysis_id", analysisId)
    .order("created_at", { ascending: true });

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read generated outputs.");
  }

  return (result.data ?? []) as GeneratedOutputRow[];
}

async function getGeneratedOutputsForProject(
  client: ShareDataClient,
  projectId: string,
) {
  const result = await client
    .from("generated_outputs")
    .select("framework, code, dependencies, setup_notes, warnings")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read generated outputs.");
  }

  return (result.data ?? []) as GeneratedOutputRow[];
}

async function getProjectComments(client: ShareDataClient, projectId: string) {
  const result = await client
    .from("project_comments")
    .select("id, project_id, author_id, body, resolved_at, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (result.error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read project comments.");
  }

  return ((result.data ?? []) as ProjectCommentRow[]).map((comment) => ({
    authorId: comment.author_id,
    body: comment.body,
    createdAt: comment.created_at,
    id: comment.id,
    resolvedAt: comment.resolved_at,
  }));
}

function normalizeFutureExpiration(
  expiresAt: string | null | undefined,
  now: Date,
) {
  if (!expiresAt) {
    return null;
  }

  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime()) || parsed <= now) {
    throw new ApiError("INVALID_REQUEST", "Share link expiration must be in the future.");
  }

  return parsed.toISOString();
}

function isInactiveShareLink(link: ShareLinkRow) {
  if (link.revoked_at) {
    return true;
  }

  if (!link.expires_at) {
    return false;
  }

  return new Date(link.expires_at).getTime() <= Date.now();
}

function toShareLinkSummary(link: ShareLinkRow): ShareLinkSummary {
  return {
    accessMode: link.access_mode,
    createdAt: link.created_at,
    expiresAt: link.expires_at,
    id: link.id,
    includeComments: link.include_comments,
    ownerId: link.owner_id,
    projectId: link.project_id,
    revokedAt: link.revoked_at,
  };
}

function toGeneratedOutput(row: GeneratedOutputRow): GeneratedOutput {
  return {
    code: row.code,
    dependencies: toStringArray(row.dependencies),
    framework: row.framework,
    setupNotes: toStringArray(row.setup_notes),
    warnings: toStringArray(row.warnings),
  };
}

function toMotionSpec(value: Json): MotionSpec {
  const spec = isRecord(value) ? value : {};

  return {
    accessibilityNote: stringField(spec.accessibilityNote, "Respect prefers-reduced-motion."),
    delayMs: numberField(spec.delayMs, 0),
    description: stringField(spec.description, "Shared MotionCode animation."),
    durationMs: numberField(spec.durationMs, 300),
    easing: stringField(spec.easing, "ease"),
    element: stringField(spec.element, "element"),
    gpuAccelerated: booleanField(spec.gpuAccelerated, true),
    implementationNotes: toStringArray(spec.implementationNotes),
    intent: isMotionIntent(spec.intent) ? spec.intent : "unknown",
    keyframesDetected: numberField(spec.keyframesDetected, 0),
    loops: booleanField(spec.loops, false),
    performanceScore: numberField(spec.performanceScore, 0),
  };
}

function isRecord(value: unknown): value is Record<string, Json | undefined> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringField(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberField(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanField(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isMotionIntent(value: unknown): value is MotionSpec["intent"] {
  return (
    value === "entrance" ||
    value === "exit" ||
    value === "hover" ||
    value === "morph" ||
    value === "loading" ||
    value === "loop" ||
    value === "scroll" ||
    value === "unknown"
  );
}
