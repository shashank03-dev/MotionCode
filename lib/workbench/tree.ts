import type { ProjectRow, WorkspaceRow } from "@/app/dashboard/data";

export type WorkspaceTreeNode = {
  workspace: WorkspaceRow;
  projects: ProjectRow[];
};

/**
 * Groups projects under their workspace to seed the explorer tree. Workspace
 * order is preserved from `workspaces`; projects keep their incoming order
 * (callers sort by `updated_at desc`). Projects whose `workspace_id` has no
 * matching workspace in `workspaces` are dropped — the tree only renders
 * workspaces the user can see.
 */
export function buildWorkspaceTree(
  workspaces: WorkspaceRow[],
  projects: ProjectRow[],
): WorkspaceTreeNode[] {
  const byWorkspace = new Map<string, ProjectRow[]>();

  for (const project of projects) {
    const bucket = byWorkspace.get(project.workspace_id);
    if (bucket) {
      bucket.push(project);
    } else {
      byWorkspace.set(project.workspace_id, [project]);
    }
  }

  return workspaces.map((workspace) => ({
    projects: byWorkspace.get(workspace.id) ?? [],
    workspace,
  }));
}
