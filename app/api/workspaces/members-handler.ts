import type { User } from "@supabase/supabase-js";
import { z } from "zod";

import { apiError, apiSuccess, ApiError, isApiError } from "@/lib/server/apiErrors";
import {
  createSupabaseServerClient,
  getCurrentUser as getSupabaseCurrentUser,
} from "@/lib/supabase/server";
import type { Database } from "@/types/database";

import {
  getWorkspaceAccessWithSupabase,
  type WorkspaceAccess,
} from "./handler";

type WorkspaceMemberRow =
  Database["public"]["Tables"]["workspace_members"]["Row"];
type WorkspaceMemberRole = WorkspaceMemberRow["role"];
type CurrentUser = Pick<User, "id">;

type UpdateWorkspaceMemberInput = {
  memberId: string;
  role: WorkspaceMemberRole;
  workspaceId: string;
};

export type WorkspaceMemberRouteDeps = {
  getCurrentUser?: () => Promise<CurrentUser | null>;
  getWorkspaceAccess?: (
    userId: string,
    workspaceId: string,
  ) => Promise<WorkspaceAccess | null>;
  updateWorkspaceMemberRole?: (
    input: UpdateWorkspaceMemberInput,
  ) => Promise<WorkspaceMemberRow>;
};

const ResourceIdSchema = z.string().uuid();
const UpdateWorkspaceMemberRequestSchema = z
  .object({
    role: z.enum(["admin", "member"]),
  })
  .strict();

export async function handleUpdateWorkspaceMemberRequest(
  request: Request,
  deps: WorkspaceMemberRouteDeps = {},
  params: { memberId: string; workspaceId: string },
) {
  const resolvedDeps = resolveWorkspaceMemberDeps(deps);
  const user = await resolvedDeps.getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to manage workspace members.");
  }

  const parsedWorkspaceId = ResourceIdSchema.safeParse(params.workspaceId);
  const parsedMemberId = ResourceIdSchema.safeParse(params.memberId);
  if (!parsedWorkspaceId.success || !parsedMemberId.success) {
    return apiError("INVALID_REQUEST", "Invalid workspace member id.");
  }

  const access = await resolvedDeps.getWorkspaceAccess(
    user.id,
    parsedWorkspaceId.data,
  );
  if (!access) {
    return apiError("FORBIDDEN", "You do not have access to this workspace.");
  }
  if (access.role !== "owner") {
    return apiError("FORBIDDEN", "Only workspace owners can change member roles.");
  }

  const parsed = UpdateWorkspaceMemberRequestSchema.safeParse(
    await readJson(request),
  );
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid workspace member update.");
  }

  try {
    const member = await resolvedDeps.updateWorkspaceMemberRole({
      memberId: parsedMemberId.data,
      role: parsed.data.role,
      workspaceId: parsedWorkspaceId.data,
    });

    return apiSuccess(member);
  } catch (error) {
    return toErrorResponse(error, "Failed to update workspace member.");
  }
}

function resolveWorkspaceMemberDeps(
  deps: WorkspaceMemberRouteDeps,
): Required<WorkspaceMemberRouteDeps> {
  return {
    getCurrentUser: deps.getCurrentUser ?? getSupabaseCurrentUser,
    getWorkspaceAccess: deps.getWorkspaceAccess ?? getWorkspaceAccessWithSupabase,
    updateWorkspaceMemberRole:
      deps.updateWorkspaceMemberRole ?? updateWorkspaceMemberRoleWithSupabase,
  };
}

async function updateWorkspaceMemberRoleWithSupabase(
  input: UpdateWorkspaceMemberInput,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .update({ role: input.role })
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", input.memberId)
    .select("*")
    .single();

  if (error || !data) {
    throw new ApiError("INTERNAL_ERROR", "Failed to update workspace member.");
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
