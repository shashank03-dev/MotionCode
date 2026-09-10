import type { ReactNode } from "react";
import { Suspense } from "react";

import { ExplorerLoading } from "@/components/app/ExplorerLoading";
import { Workbench } from "@/components/app/Workbench";
import { WorkbenchTree } from "@/components/app/WorkbenchTree";
import { getEntitlementSummaryCached } from "@/lib/server/entitlements";
import { getCurrentUserCached } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function WorkbenchLayout({
  children,
}: {
  children: ReactNode;
}) {
  // The layout can't know the requested path, so it must not own the auth
  // redirect — each page calls requireDashboardUser() with the correct `next`.
  // When signed out we render children bare and let that page-level guard fire.
  const user = await getCurrentUserCached();
  if (!user) {
    return <>{children}</>;
  }

  const summary = await getEntitlementSummaryCached(user.id);

  return (
    <Workbench
      explorer={
        <Suspense fallback={<ExplorerLoading />}>
          <WorkbenchTree user={{ id: user.id }} />
        </Suspense>
      }
      planTier={summary.planTier}
      userEmail={user.email}
      userId={user.id}
    >
      {children}
    </Workbench>
  );
}
