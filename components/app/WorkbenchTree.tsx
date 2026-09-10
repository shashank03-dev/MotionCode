import "server-only";

import type { User } from "@supabase/supabase-js";

import { getWorkbenchTreeData } from "@/app/dashboard/data";
import type { ProjectRow, WorkspaceRow } from "@/app/dashboard/data";
import { buildWorkspaceTree } from "@/lib/workbench/tree";

import { ExplorerTree } from "./explorer/ExplorerTree";

export async function WorkbenchTree({
  user,
}: {
  user: Pick<User, "id">;
}) {
  const data = await getWorkbenchTreeData(user);
  // getWorkbenchTreeData selects only the columns the explorer reads
  // (id/name/updated_at + id/title/updated_at/workspace_id). The tree builder
  // still types rows as full Row types; the cast is safe because it only reads
  // that subset at runtime.
  const tree = buildWorkspaceTree(
    data.workspaces as WorkspaceRow[],
    data.projects as ProjectRow[],
  );

  return <ExplorerTree tree={tree} />;
}
