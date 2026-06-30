import type { ReactNode } from "react";

import { Workbench } from "@/components/app/Workbench";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import { getCurrentUser } from "@/lib/supabase/server";
import { buildWorkspaceTree } from "@/lib/workbench/tree";

import { getDashboardData } from "../dashboard/data";

export const dynamic = "force-dynamic";

export default async function WorkbenchLayout({
  children,
}: {
  children: ReactNode;
}) {
  // The layout can't know the requested path, so it must not own the auth
  // redirect — each page calls requireDashboardUser() with the correct `next`.
  // When signed out we render children bare and let that page-level guard fire.
  const user = await getCurrentUser();
  if (!user) {
    return <>{children}</>;
  }

  const [data, summary] = await Promise.all([
    getDashboardData(user),
    getEntitlementSummary(user.id),
  ]);
  const tree = buildWorkspaceTree(data.workspaces, data.projects);

  return (
    <Workbench tree={tree} planTier={summary.planTier} userEmail={user.email}>
      {children}
    </Workbench>
  );
}
