import "server-only";

import type { User } from "@supabase/supabase-js";

import { getWorkbenchTreeData } from "@/app/dashboard/data";
import { buildWorkspaceTree } from "@/lib/workbench/tree";

import { ExplorerTree } from "./explorer/ExplorerTree";

export async function WorkbenchTree({
  user,
}: {
  user: Pick<User, "id">;
}) {
  const data = await getWorkbenchTreeData(user);
  const tree = buildWorkspaceTree(data.workspaces, data.projects);

  return <ExplorerTree tree={tree} />;
}
