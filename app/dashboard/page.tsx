import { ArrowUpRight, Sparkles } from "lucide-react";

import { AppShell } from "@/components/dashboard/app-shell";
import { UpgradeGate } from "@/components/app/UpgradeGate";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { WorkspaceList } from "@/components/dashboard/workspace-list";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";
import { PageHeader, Pill } from "@/components/ui/kit";
import { ButtonLink } from "@/components/ui/site-button";
import { getEntitlementSummary } from "@/lib/server/entitlements";

import { getDashboardData, requireDashboardUser } from "./data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireDashboardUser("/dashboard");
  const entitlements = await getEntitlementSummary(user.id);

  if (entitlements.planTier === "free") {
    return (
      <AppShell
        active="dashboard"
        planTier="free"
        userEmail={user.email}
        userId={user.id}
      >
        <UpgradeGate feature="your Dashboard" />
      </AppShell>
    );
  }

  const data = await getDashboardData(user);

  return (
    <AppShell
      active="dashboard"
      planTier={entitlements.planTier}
      userEmail={user.email}
      userId={user.id}
    >
      <div className="space-y-9">
        <PageHeader
          eyebrow="Workspace home"
          title="Everything you've analyzed, in one frame."
          description="Start a motion analysis, reopen recent work, or organize your team spaces without leaving the app."
          actions={
            <>
              <Pill tone="accent">{entitlements.planTier} plan</Pill>
              <ButtonLink href="/app" variant="primary" size="md">
                <Sparkles className="size-4" aria-hidden="true" />
                Analyze motion
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </>
          }
        />

        <DashboardSummary data={data} />
        <CreateWorkspaceForm />
        <WorkspaceList workspaces={data.workspaces} />
        <RecentProjects projects={data.projects} />
      </div>
    </AppShell>
  );
}
