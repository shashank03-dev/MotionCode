import type { User } from "@supabase/supabase-js";
import * as navigation from "next/navigation";

import { loginPathForNext } from "@/lib/auth/redirects";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import {
  createSupabaseServerClient,
  getCurrentUser,
} from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
export type WorkspaceMemberRow =
  Database["public"]["Tables"]["workspace_members"]["Row"];
export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectVersionRow =
  Database["public"]["Tables"]["project_versions"]["Row"];
export type UsageEventRow =
  Database["public"]["Tables"]["usage_events"]["Row"];
export type WorkspaceRole = "owner" | "admin" | "member";

export type DashboardData = {
  profile: ProfileRow | null;
  projects: ProjectRow[];
  usageEvents: UsageEventRow[];
  workspaces: WorkspaceRow[];
};

export type WorkspacePageData = {
  members: WorkspaceMemberRow[];
  projects: ProjectRow[];
  role: WorkspaceRole;
  workspace: WorkspaceRow;
};

export type ProjectPageData = {
  project: ProjectRow;
  role: WorkspaceRole;
  versions: ProjectVersionRow[];
  workspace: WorkspaceRow;
};

export type VersionPageData = ProjectPageData & {
  version: ProjectVersionRow;
};

type DashboardUserOptions = {
  paidOnly?: boolean;
};

export async function requireDashboardUser(
  nextPath?: string,
  options: DashboardUserOptions = {},
) {
  const user = await getCurrentUser();

  if (!user) {
    navigation.redirect(loginPathForNext(nextPath));
  }

  if (options.paidOnly) {
    const summary = await getEntitlementSummary(user.id);

    if (summary.planTier === "free") {
      navigation.redirect("/app");
    }
  }

  return user;
}

export async function getDashboardData(user: Pick<User, "id">) {
  const supabase = await createSupabaseServerClient();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);

  const [profile, workspaces, projects, usageEvents] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("workspaces")
      .select("*")
      .order("updated_at", { ascending: false }),
    supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("usage_events")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: false }),
  ]);

  if (profile.error || workspaces.error || projects.error || usageEvents.error) {
    throw new Error("Failed to load dashboard data.");
  }

  return {
    profile: profile.data ?? null,
    projects: projects.data ?? [],
    usageEvents: usageEvents.data ?? [],
    workspaces: workspaces.data ?? [],
  } satisfies DashboardData;
}

export async function getWorkspacePageData(
  workspaceId: string,
  user: Pick<User, "id">,
) {
  const supabase = await createSupabaseServerClient();
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) {
    throw new Error("Failed to load workspace.");
  }
  if (!workspace) {
    navigation.notFound();
  }

  const [projects, members, role] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: true }),
    getWorkspaceRole(workspace, user.id),
  ]);

  if (projects.error || members.error) {
    throw new Error("Failed to load workspace details.");
  }

  return {
    members: members.data ?? [],
    projects: projects.data ?? [],
    role,
    workspace,
  } satisfies WorkspacePageData;
}

export async function getProjectPageData(
  projectId: string,
  user: Pick<User, "id">,
) {
  const supabase = await createSupabaseServerClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    throw new Error("Failed to load project.");
  }
  if (!project) {
    navigation.notFound();
  }

  const [workspace, versions] = await Promise.all([
    supabase
      .from("workspaces")
      .select("*")
      .eq("id", project.workspace_id)
      .maybeSingle(),
    supabase
      .from("project_versions")
      .select("*")
      .eq("project_id", project.id)
      .order("version_number", { ascending: false }),
  ]);

  if (workspace.error || versions.error) {
    throw new Error("Failed to load project details.");
  }
  if (!workspace.data) {
    navigation.notFound();
  }

  return {
    project,
    role: await getWorkspaceRole(workspace.data, user.id),
    versions: versions.data ?? [],
    workspace: workspace.data,
  } satisfies ProjectPageData;
}

export async function getVersionPageData(
  projectId: string,
  versionId: string,
  user: Pick<User, "id">,
) {
  const projectData = await getProjectPageData(projectId, user);
  const version = projectData.versions.find((item) => item.id === versionId);

  if (!version) {
    navigation.notFound();
  }

  return {
    ...projectData,
    version,
  } satisfies VersionPageData;
}

export function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

async function getWorkspaceRole(
  workspace: WorkspaceRow,
  userId: string,
): Promise<WorkspaceRole> {
  if (workspace.owner_id === userId) {
    return "owner";
  }

  const supabase = await createSupabaseServerClient();
  const { data: member, error: memberError } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError) {
    throw new Error("Failed to load workspace role.");
  }
  if (member?.role) {
    return member.role;
  }

  const { data: teamMember, error: teamMemberError } = await supabase
    .from("team_members")
    .select("role")
    .eq("workspace_id", workspace.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (teamMemberError) {
    throw new Error("Failed to load team role.");
  }

  return teamMember?.role ?? "member";
}
