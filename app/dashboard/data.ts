import type { User } from "@supabase/supabase-js";
import * as navigation from "next/navigation";

import { loginPathForNext } from "@/lib/auth/redirects";
import type { PlanTier } from "@/lib/contracts/plans";
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

export type WorkspaceFolderSummary = {
  projectCount: number;
  recentProjects: Array<Pick<ProjectRow, "id" | "title" | "updated_at">>;
  workspace: WorkspaceRow;
};

export type WorkspaceDesktopData = WorkspacePageData & {
  /** Saved sequences (project versions) per project id. */
  sequenceCounts: Record<string, number>;
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

export type PlanGate = {
  isPaid: boolean;
  planTier: PlanTier;
};

/**
 * Resolves whether a user is on a paid plan, for pages that render an in-place
 * upgrade gate instead of redirecting. Free users get `isPaid: false`; the page
 * is responsible for short-circuiting to <UpgradeGate /> when so.
 */
export async function resolvePlanGate(userId: string): Promise<PlanGate> {
  const summary = await getEntitlementSummary(userId);
  return {
    isPaid: summary.planTier !== "free",
    planTier: summary.planTier,
  };
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

/**
 * Loads every workspace the user can see plus lightweight project rollups for
 * the desktop (folder grid) view. RLS scopes both queries to the session.
 */
export async function getWorkspaceFolders(): Promise<WorkspaceFolderSummary[]> {
  const supabase = await createSupabaseServerClient();

  const [workspaces, projects] = await Promise.all([
    supabase
      .from("workspaces")
      .select("*")
      .order("updated_at", { ascending: false }),
    supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false }),
  ]);

  if (workspaces.error || projects.error) {
    throw new Error("Failed to load workspaces.");
  }

  const byWorkspace = new Map<string, ProjectRow[]>();
  for (const project of projects.data ?? []) {
    const bucket = byWorkspace.get(project.workspace_id);
    if (bucket) {
      bucket.push(project);
    } else {
      byWorkspace.set(project.workspace_id, [project]);
    }
  }

  return (workspaces.data ?? []).map((workspace) => {
    const workspaceProjects = byWorkspace.get(workspace.id) ?? [];
    return {
      projectCount: workspaceProjects.length,
      recentProjects: workspaceProjects.slice(0, 2).map((project) => ({
        id: project.id,
        title: project.title,
        updated_at: project.updated_at,
      })),
      workspace,
    };
  });
}

/**
 * Workspace page data plus how many saved sequences each project holds, for
 * the opened-folder (files) view.
 */
export async function getWorkspaceDesktopData(
  workspaceId: string,
  user: Pick<User, "id">,
): Promise<WorkspaceDesktopData> {
  const data = await getWorkspacePageData(workspaceId, user);
  const projectIds = data.projects.map((project) => project.id);

  if (projectIds.length === 0) {
    return { ...data, sequenceCounts: {} };
  }

  const supabase = await createSupabaseServerClient();
  const { data: versions, error } = await supabase
    .from("project_versions")
    .select("project_id")
    .in("project_id", projectIds);

  if (error) {
    throw new Error("Failed to load workspace sequences.");
  }

  const sequenceCounts: Record<string, number> = {};
  for (const version of versions ?? []) {
    sequenceCounts[version.project_id] =
      (sequenceCounts[version.project_id] ?? 0) + 1;
  }

  return { ...data, sequenceCounts };
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
