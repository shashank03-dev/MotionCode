import type { User } from "@supabase/supabase-js";
import { z } from "zod";

import { apiError, apiSuccess, ApiError, isApiError } from "@/lib/server/apiErrors";
import {
  getEntitlementSummary as getEntitlementSummaryForUser,
  type EntitlementSummary,
} from "@/lib/server/entitlements";
import {
  createSupabaseServerClient,
  getCurrentUser as getSupabaseCurrentUser,
} from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

import {
  getWorkspaceAccessWithSupabase,
  type WorkspaceAccess,
  type WorkspaceAccessWorkspace,
  type WorkspaceRole,
} from "../workspaces/handler";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ProjectVersionRow =
  Database["public"]["Tables"]["project_versions"]["Row"];
type CurrentUser = Pick<User, "id">;
type ProjectAccessProject = Pick<ProjectRow, "id" | "owner_id" | "workspace_id"> &
  Partial<ProjectRow>;
type ProjectMutationResult = Pick<ProjectRow, "id"> & Partial<ProjectRow>;
type ProjectEntitlementSummary = Pick<
  EntitlementSummary,
  "entitlements" | "planTier"
>;

export type ProjectAccess = {
  isProjectOwner?: boolean;
  project: ProjectAccessProject;
  role: WorkspaceRole;
  workspace: WorkspaceAccessWorkspace;
};

type CreateProjectInput = {
  description: string | null;
  ownerId: string;
  sourceType: ProjectRow["source_type"];
  title: string;
  workspaceId: string;
};

type UpdateProjectInput = {
  description?: string | null;
  projectId: string;
  status?: ProjectRow["status"];
  title?: string;
};

type CreateProjectVersionInput = {
  createdBy: string;
  label: string | null;
  motionSpec: Json;
  projectId: string;
};

export type ProjectRouteDeps = {
  archiveProject?: (projectId: string) => Promise<ProjectMutationResult>;
  createProject?: (input: CreateProjectInput) => Promise<ProjectMutationResult>;
  createProjectVersion?: (
    input: CreateProjectVersionInput,
  ) => Promise<ProjectVersionRow>;
  getCurrentUser?: () => Promise<CurrentUser | null>;
  getEntitlementSummary?: (
    userId: string,
  ) => Promise<ProjectEntitlementSummary>;
  getProjectAccess?: (
    userId: string,
    projectId: string,
  ) => Promise<ProjectAccess | null>;
  getProjectVersion?: (
    projectId: string,
    versionId: string,
  ) => Promise<ProjectVersionRow | null>;
  getWorkspaceAccess?: (
    userId: string,
    workspaceId: string,
  ) => Promise<WorkspaceAccess | null>;
  listProjects?: (userId: string, workspaceId?: string) => Promise<ProjectRow[]>;
  updateProject?: (input: UpdateProjectInput) => Promise<ProjectMutationResult>;
};

const ResourceIdSchema = z.string().uuid();
const ProjectTitleSchema = z.string().trim().min(1).max(120);
const DescriptionSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => value || null)
  .nullable()
  .optional();

const CreateProjectRequestSchema = z
  .object({
    description: DescriptionSchema,
    sourceType: z.enum(["upload", "url", "prompt"]),
    title: ProjectTitleSchema,
    workspaceId: ResourceIdSchema,
  })
  .strict();

const UpdateProjectRequestSchema = z
  .object({
    description: DescriptionSchema,
    status: z
      .enum(["draft", "uploaded", "analyzing", "generated", "archived"])
      .optional(),
    title: ProjectTitleSchema.optional(),
  })
  .strict()
  .refine((value) => value.description !== undefined || value.status || value.title, {
    message: "At least one project field is required.",
  });

const CreateProjectVersionRequestSchema = z
  .object({
    label: z
      .string()
      .trim()
      .max(80)
      .transform((value) => value || null)
      .nullable()
      .optional(),
    motionSpec: z.unknown(),
  })
  .strict();

export async function handleListProjectsRequest(
  request: Request,
  deps: ProjectRouteDeps = {},
) {
  const resolvedDeps = resolveProjectDeps(deps);
  const user = await resolvedDeps.getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to manage projects.");
  }

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  if (workspaceId && !ResourceIdSchema.safeParse(workspaceId).success) {
    return apiError("INVALID_REQUEST", "Invalid workspace id.");
  }

  try {
    if (workspaceId) {
      const access = await resolvedDeps.getWorkspaceAccess(user.id, workspaceId);
      if (!access) {
        return apiError("FORBIDDEN", "You do not have access to this workspace.");
      }
    }

    const projects = await resolvedDeps.listProjects(
      user.id,
      workspaceId ?? undefined,
    );
    return apiSuccess(projects);
  } catch (error) {
    return toErrorResponse(error, "Failed to read projects.");
  }
}

export async function handleCreateProjectRequest(
  request: Request,
  deps: ProjectRouteDeps = {},
) {
  const resolvedDeps = resolveProjectDeps(deps);
  const user = await resolvedDeps.getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to manage projects.");
  }

  const parsed = CreateProjectRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid project request.");
  }

  const workspaceAccess = await resolvedDeps.getWorkspaceAccess(
    user.id,
    parsed.data.workspaceId,
  );
  if (!workspaceAccess) {
    return apiError("FORBIDDEN", "You do not have access to this workspace.");
  }

  try {
    await enforceSavedProjectLimit({
      deps: resolvedDeps,
      userId: user.id,
      workspaceId: parsed.data.workspaceId,
    });

    const project = await resolvedDeps.createProject({
      description: parsed.data.description ?? null,
      ownerId: user.id,
      sourceType: parsed.data.sourceType,
      title: parsed.data.title,
      workspaceId: parsed.data.workspaceId,
    });

    return apiSuccess(project, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create project.");
  }
}

export async function handleGetProjectRequest(
  _request: Request,
  deps: ProjectRouteDeps = {},
  params: { projectId: string },
) {
  const resolvedDeps = resolveProjectDeps(deps);
  const user = await resolvedDeps.getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to manage projects.");
  }

  const parsedProjectId = ResourceIdSchema.safeParse(params.projectId);
  if (!parsedProjectId.success) {
    return apiError("INVALID_REQUEST", "Invalid project id.");
  }

  try {
    const access = await resolvedDeps.getProjectAccess(
      user.id,
      parsedProjectId.data,
    );
    if (!access) {
      return apiError("NOT_FOUND", "Project not found.");
    }

    return apiSuccess(access);
  } catch (error) {
    return toErrorResponse(error, "Failed to read project.");
  }
}

export async function handleUpdateProjectRequest(
  request: Request,
  deps: ProjectRouteDeps = {},
  params: { projectId: string },
) {
  const resolvedDeps = resolveProjectDeps(deps);
  const accessDecision = await requireProjectWriteAccess(
    resolvedDeps,
    params.projectId,
  );

  if (!accessDecision.ok) {
    return accessDecision.response;
  }

  const parsed = UpdateProjectRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid project update.");
  }

  try {
    const project = await resolvedDeps.updateProject({
      description:
        parsed.data.description === undefined
          ? undefined
          : parsed.data.description,
      projectId: accessDecision.projectId,
      status: parsed.data.status,
      title: parsed.data.title,
    });

    return apiSuccess(project);
  } catch (error) {
    return toErrorResponse(error, "Failed to update project.");
  }
}

export async function handleArchiveProjectRequest(
  _request: Request,
  deps: ProjectRouteDeps = {},
  params: { projectId: string },
) {
  const resolvedDeps = resolveProjectDeps(deps);
  const accessDecision = await requireProjectWriteAccess(
    resolvedDeps,
    params.projectId,
  );

  if (!accessDecision.ok) {
    return accessDecision.response;
  }

  try {
    const project = await resolvedDeps.archiveProject(accessDecision.projectId);
    return apiSuccess(project);
  } catch (error) {
    return toErrorResponse(error, "Failed to archive project.");
  }
}

export async function handleCreateProjectVersionRequest(
  request: Request,
  deps: ProjectRouteDeps = {},
  params: { projectId: string },
) {
  const resolvedDeps = resolveProjectDeps(deps);
  const accessDecision = await requireProjectWriteAccess(
    resolvedDeps,
    params.projectId,
  );

  if (!accessDecision.ok) {
    return accessDecision.response;
  }

  const parsed = CreateProjectVersionRequestSchema.safeParse(
    await readJson(request),
  );
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid project version request.");
  }

  try {
    const version = await resolvedDeps.createProjectVersion({
      createdBy: accessDecision.userId,
      label: parsed.data.label ?? null,
      motionSpec: parsed.data.motionSpec as Json,
      projectId: accessDecision.projectId,
    });

    return apiSuccess(version, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create project version.");
  }
}

export async function handleGetProjectVersionRequest(
  _request: Request,
  deps: ProjectRouteDeps = {},
  params: { projectId: string; versionId: string },
) {
  const resolvedDeps = resolveProjectDeps(deps);
  const user = await resolvedDeps.getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to view project versions.");
  }

  const parsedProjectId = ResourceIdSchema.safeParse(params.projectId);
  const parsedVersionId = ResourceIdSchema.safeParse(params.versionId);
  if (!parsedProjectId.success || !parsedVersionId.success) {
    return apiError("INVALID_REQUEST", "Invalid project version id.");
  }

  const access = await resolvedDeps.getProjectAccess(user.id, parsedProjectId.data);
  if (!access) {
    return apiError("NOT_FOUND", "Project not found.");
  }

  try {
    const version = await resolvedDeps.getProjectVersion(
      parsedProjectId.data,
      parsedVersionId.data,
    );
    if (!version) {
      return apiError("NOT_FOUND", "Project version not found.");
    }

    return apiSuccess(version);
  } catch (error) {
    return toErrorResponse(error, "Failed to read project version.");
  }
}

function resolveProjectDeps(deps: ProjectRouteDeps): Required<ProjectRouteDeps> {
  return {
    archiveProject: deps.archiveProject ?? archiveProjectWithSupabase,
    createProject: deps.createProject ?? createProjectWithSupabase,
    createProjectVersion:
      deps.createProjectVersion ?? createProjectVersionWithSupabase,
    getCurrentUser: deps.getCurrentUser ?? getSupabaseCurrentUser,
    getEntitlementSummary:
      deps.getEntitlementSummary ?? getEntitlementSummaryForUser,
    getProjectAccess: deps.getProjectAccess ?? getProjectAccessWithSupabase,
    getProjectVersion: deps.getProjectVersion ?? getProjectVersionWithSupabase,
    getWorkspaceAccess: deps.getWorkspaceAccess ?? getWorkspaceAccessWithSupabase,
    listProjects: deps.listProjects ?? listProjectsWithSupabase,
    updateProject: deps.updateProject ?? updateProjectWithSupabase,
  };
}

async function enforceSavedProjectLimit({
  deps,
  userId,
  workspaceId,
}: {
  deps: Required<ProjectRouteDeps>;
  userId: string;
  workspaceId: string;
}) {
  const summary = await deps.getEntitlementSummary(userId);
  const savedProjectLimit = summary.entitlements.savedProjects;
  const projects = await deps.listProjects(userId, workspaceId);
  const activeSavedProjectCount = projects.filter((project) =>
    isActiveSavedProject(project, userId),
  ).length;

  if (activeSavedProjectCount >= savedProjectLimit) {
    throw new ApiError(
      "QUOTA_EXCEEDED",
      formatSavedProjectLimitMessage(summary.planTier, savedProjectLimit),
    );
  }
}

function isActiveSavedProject(project: Partial<ProjectRow>, userId: string) {
  if (project.owner_id && project.owner_id !== userId) {
    return false;
  }

  return project.status !== "archived";
}

function formatSavedProjectLimitMessage(
  planTier: ProjectEntitlementSummary["planTier"],
  limit: number,
) {
  const noun = limit === 1 ? "project" : "projects";
  const planLabel = planTier === "free" ? "free plan" : `${planTier} plan`;

  return `Your ${planLabel} includes ${limit} active saved ${noun}. Archive or delete a project before creating another.`;
}

async function requireProjectWriteAccess(
  deps: Required<ProjectRouteDeps>,
  projectId: string,
): Promise<
  | { ok: true; projectId: string; userId: string }
  | { ok: false; response: Response }
> {
  const user = await deps.getCurrentUser();

  if (!user) {
    return {
      ok: false,
      response: apiError("UNAUTHENTICATED", "Sign in to manage projects."),
    };
  }

  const parsedProjectId = ResourceIdSchema.safeParse(projectId);
  if (!parsedProjectId.success) {
    return {
      ok: false,
      response: apiError("INVALID_REQUEST", "Invalid project id."),
    };
  }

  const access = await deps.getProjectAccess(user.id, parsedProjectId.data);
  if (!access) {
    return {
      ok: false,
      response: apiError("NOT_FOUND", "Project not found."),
    };
  }
  if (!canWriteProject(access)) {
    return {
      ok: false,
      response: apiError("FORBIDDEN", "You cannot change this project."),
    };
  }

  return { ok: true, projectId: parsedProjectId.data, userId: user.id };
}

export function canWriteProject(access: ProjectAccess) {
  return (
    access.isProjectOwner === true ||
    access.role === "owner" ||
    (access.workspace.plan_tier === "studio" && access.role === "admin")
  );
}

async function createProjectWithSupabase(input: CreateProjectInput) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      description: input.description,
      owner_id: input.ownerId,
      source_type: input.sourceType,
      title: input.title,
      workspace_id: input.workspaceId,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new ApiError("INTERNAL_ERROR", "Failed to create project.");
  }

  return data;
}

async function updateProjectWithSupabase(input: UpdateProjectInput) {
  const update: Database["public"]["Tables"]["projects"]["Update"] = {};

  if (input.description !== undefined) {
    update.description = input.description;
  }
  if (input.status) {
    update.status = input.status;
  }
  if (input.title) {
    update.title = input.title;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", input.projectId)
    .select("*")
    .single();

  if (error || !data) {
    throw new ApiError("INTERNAL_ERROR", "Failed to update project.");
  }

  return data;
}

async function archiveProjectWithSupabase(projectId: string) {
  return updateProjectWithSupabase({ projectId, status: "archived" });
}

async function listProjectsWithSupabase(_userId: string, workspaceId?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  const { data, error } = await query;

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read projects.");
  }

  return data ?? [];
}

export async function getProjectAccessWithSupabase(
  userId: string,
  projectId: string,
): Promise<ProjectAccess | null> {
  const supabase = await createSupabaseServerClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read project.");
  }
  if (!project) {
    return null;
  }

  const workspaceAccess = await getWorkspaceAccessWithSupabase(
    userId,
    project.workspace_id,
  );
  if (!workspaceAccess) {
    return null;
  }

  return {
    isProjectOwner: project.owner_id === userId,
    project,
    role: workspaceAccess.role,
    workspace: workspaceAccess.workspace,
  };
}

async function createProjectVersionWithSupabase(
  input: CreateProjectVersionInput,
) {
  const supabase = await createSupabaseServerClient();
  const { data: latestVersion, error: latestVersionError } = await supabase
    .from("project_versions")
    .select("version_number")
    .eq("project_id", input.projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestVersionError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read project versions.");
  }

  const versionNumber = (latestVersion?.version_number ?? 0) + 1;
  const { data: version, error: versionError } = await supabase
    .from("project_versions")
    .insert({
      created_by: input.createdBy,
      label: input.label,
      motion_spec: input.motionSpec,
      project_id: input.projectId,
      version_number: versionNumber,
    })
    .select("*")
    .single();

  if (versionError || !version) {
    throw new ApiError("INTERNAL_ERROR", "Failed to create project version.");
  }

  const { error: projectError } = await supabase
    .from("projects")
    .update({ latest_version_id: version.id, status: "generated" })
    .eq("id", input.projectId);

  if (projectError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to update project version.");
  }

  return version;
}

async function getProjectVersionWithSupabase(
  projectId: string,
  versionId: string,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("project_versions")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", versionId)
    .maybeSingle();

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read project version.");
  }

  return data;
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

function toErrorResponse(error: unknown, fallbackMessage: string) {
  if (isApiError(error)) {
    return apiError(error.code, error.message, { status: error.status });
  }

  return apiError("INTERNAL_ERROR", fallbackMessage);
}
