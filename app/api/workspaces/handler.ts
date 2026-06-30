import type { User } from "@supabase/supabase-js";
import { z } from "zod";

import { apiError, apiSuccess, ApiError, isApiError } from "@/lib/server/apiErrors";
import { ensureProfileForUser } from "@/lib/server/profiles";
import { createSupabaseAdminClient } from "@/lib/server/supabaseAdmin";
import {
  createSupabaseServerClient,
  getCurrentUser as getSupabaseCurrentUser,
} from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type WorkspaceRole = "owner" | "admin" | "member";

export type WorkspaceAccessWorkspace = Pick<WorkspaceRow, "id" | "owner_id"> &
  Partial<WorkspaceRow>;

export type WorkspaceAccess = {
  role: WorkspaceRole;
  workspace: WorkspaceAccessWorkspace;
};

type CurrentUser = Pick<User, "id">;

type CreateWorkspaceInput = {
  name: string;
  ownerId: string;
  slug: string;
};

type UpdateWorkspaceInput = {
  name?: string;
  slug?: string;
  workspaceId: string;
};

export type WorkspaceRouteDeps = {
  createWorkspace?: (input: CreateWorkspaceInput) => Promise<WorkspaceRow>;
  ensureProfile?: (userId: string) => Promise<void>;
  getCurrentUser?: () => Promise<CurrentUser | null>;
  getWorkspaceAccess?: (
    userId: string,
    workspaceId: string,
  ) => Promise<WorkspaceAccess | null>;
  listWorkspaces?: (userId: string) => Promise<WorkspaceRow[]>;
  markOnboardingComplete?: (userId: string) => Promise<void>;
  updateWorkspace?: (input: UpdateWorkspaceInput) => Promise<WorkspaceRow>;
};

const ResourceIdSchema = z.string().uuid();
const WorkspaceNameSchema = z.string().trim().min(1).max(80);
const WorkspaceSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(80);

const CreateWorkspaceRequestSchema = z
  .object({
    name: WorkspaceNameSchema,
    slug: WorkspaceSlugSchema.optional(),
  })
  .strict();

const UpdateWorkspaceRequestSchema = z
  .object({
    name: WorkspaceNameSchema.optional(),
    slug: WorkspaceSlugSchema.optional(),
  })
  .strict()
  .refine((value) => value.name || value.slug, {
    message: "At least one workspace field is required.",
  });

export async function handleListWorkspacesRequest(
  _request: Request,
  deps: WorkspaceRouteDeps = {},
) {
  const resolvedDeps = resolveWorkspaceDeps(deps);
  const user = await resolvedDeps.getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to manage workspaces.");
  }

  try {
    const workspaces = await resolvedDeps.listWorkspaces(user.id);
    return apiSuccess(workspaces);
  } catch (error) {
    return toErrorResponse(error, "Failed to read workspaces.");
  }
}

export async function handleCreateWorkspaceRequest(
  request: Request,
  deps: WorkspaceRouteDeps = {},
) {
  const resolvedDeps = resolveWorkspaceDeps(deps);
  const user = await resolvedDeps.getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to manage workspaces.");
  }

  const parsed = CreateWorkspaceRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Workspace name is required.");
  }

  const name = parsed.data.name;
  const slug = parsed.data.slug ?? slugify(name);

  try {
    // The workspaces.owner_id FK requires a public.profiles row. Password
    // sign-in does not pass through /auth/callback, so the profile may not have
    // been created yet — make sure it exists before inserting.
    await resolvedDeps.ensureProfile(user.id);

    const workspace = await resolvedDeps.createWorkspace({
      name,
      ownerId: user.id,
      slug,
    });
    await resolvedDeps.markOnboardingComplete(user.id);

    return apiSuccess(workspace, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "Failed to create workspace.");
  }
}

export async function handleGetWorkspaceRequest(
  _request: Request,
  deps: WorkspaceRouteDeps = {},
  params: { workspaceId: string },
) {
  const resolvedDeps = resolveWorkspaceDeps(deps);
  const user = await resolvedDeps.getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to manage workspaces.");
  }

  const parsedWorkspaceId = ResourceIdSchema.safeParse(params.workspaceId);
  if (!parsedWorkspaceId.success) {
    return apiError("INVALID_REQUEST", "Invalid workspace id.");
  }

  try {
    const access = await resolvedDeps.getWorkspaceAccess(
      user.id,
      parsedWorkspaceId.data,
    );

    if (!access) {
      return apiError("FORBIDDEN", "You do not have access to this workspace.");
    }

    return apiSuccess(access);
  } catch (error) {
    return toErrorResponse(error, "Failed to read workspace.");
  }
}

export async function handleUpdateWorkspaceRequest(
  request: Request,
  deps: WorkspaceRouteDeps = {},
  params: { workspaceId: string },
) {
  const resolvedDeps = resolveWorkspaceDeps(deps);
  const user = await resolvedDeps.getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to manage workspaces.");
  }

  const parsedWorkspaceId = ResourceIdSchema.safeParse(params.workspaceId);
  if (!parsedWorkspaceId.success) {
    return apiError("INVALID_REQUEST", "Invalid workspace id.");
  }

  const access = await resolvedDeps.getWorkspaceAccess(
    user.id,
    parsedWorkspaceId.data,
  );
  if (!access) {
    return apiError("FORBIDDEN", "You do not have access to this workspace.");
  }
  if (access.role !== "owner") {
    return apiError("FORBIDDEN", "Only workspace owners can update settings.");
  }

  const parsed = UpdateWorkspaceRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid workspace update.");
  }

  try {
    const workspace = await resolvedDeps.updateWorkspace({
      name: parsed.data.name,
      slug: parsed.data.slug,
      workspaceId: parsedWorkspaceId.data,
    });

    return apiSuccess(workspace);
  } catch (error) {
    return toErrorResponse(error, "Failed to update workspace.");
  }
}

function resolveWorkspaceDeps(
  deps: WorkspaceRouteDeps,
): Required<WorkspaceRouteDeps> {
  return {
    createWorkspace: deps.createWorkspace ?? createWorkspaceWithSupabase,
    ensureProfile: deps.ensureProfile ?? ensureProfileWithSupabase,
    getCurrentUser: deps.getCurrentUser ?? getSupabaseCurrentUser,
    getWorkspaceAccess: deps.getWorkspaceAccess ?? getWorkspaceAccessWithSupabase,
    listWorkspaces: deps.listWorkspaces ?? listWorkspacesWithSupabase,
    markOnboardingComplete:
      deps.markOnboardingComplete ?? markOnboardingCompleteWithSupabase,
    updateWorkspace: deps.updateWorkspace ?? updateWorkspaceWithSupabase,
  };
}

async function ensureProfileWithSupabase(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);

  if (error || !data.user) {
    console.error("[workspaces] failed to load auth user for profile ensure", {
      code: error?.code,
      message: error?.message,
    });
    throw new ApiError("INTERNAL_ERROR", "Failed to create workspace.");
  }

  await ensureProfileForUser(data.user, admin);
}

async function createWorkspaceWithSupabase(input: CreateWorkspaceInput) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      name: input.name,
      owner_id: input.ownerId,
      slug: input.slug,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("[workspaces] insert failed", {
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      message: error?.message,
    });
    throw new ApiError("INTERNAL_ERROR", "Failed to create workspace.");
  }

  return data;
}

async function updateWorkspaceWithSupabase(input: UpdateWorkspaceInput) {
  const update: Database["public"]["Tables"]["workspaces"]["Update"] = {};

  if (input.name) {
    update.name = input.name;
  }
  if (input.slug) {
    update.slug = input.slug;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspaces")
    .update(update)
    .eq("id", input.workspaceId)
    .select("*")
    .single();

  if (error || !data) {
    throw new ApiError("INTERNAL_ERROR", "Failed to update workspace.");
  }

  return data;
}

async function listWorkspacesWithSupabase() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read workspaces.");
  }

  return data ?? [];
}

export async function getWorkspaceAccessWithSupabase(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceAccess | null> {
  const supabase = await createSupabaseServerClient();
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read workspace.");
  }
  if (!workspace) {
    return null;
  }

  if (workspace.owner_id === userId) {
    return { role: "owner", workspace };
  }

  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read workspace membership.");
  }
  if (member?.role) {
    return { role: member.role, workspace };
  }

  const { data: teamMember, error: teamMemberError } = await supabase
    .from("team_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (teamMemberError) {
    throw new ApiError("INTERNAL_ERROR", "Failed to read team membership.");
  }
  if (teamMember?.role) {
    return { role: teamMember.role, workspace };
  }

  return null;
}

async function markOnboardingCompleteWithSupabase(userId: string) {
  const update: ProfileUpdate = {
    onboarding_completed_at: new Date().toISOString(),
  };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .is("onboarding_completed_at", null);

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to update onboarding state.");
  }
}

export function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return slug || "workspace";
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
