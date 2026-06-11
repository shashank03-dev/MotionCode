import { AppShell } from "@/components/dashboard/app-shell";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { WorkspaceList } from "@/components/dashboard/workspace-list";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";

import { getDashboardData, requireDashboardUser } from "./data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireDashboardUser("/dashboard", { paidOnly: true });
  const data = await getDashboardData(user);

  return (
    <AppShell active="dashboard" userEmail={user.email}>
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#56544966] pb-6">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#8f887a]">
              Dashboard
            </p>
            <h1 className="font-mono text-3xl text-[#fffbf4] sm:text-4xl">
              Workspace command
            </h1>
          </div>
          <div className="text-sm text-[#8f887a]">
            {data.profile?.plan_tier ?? "free"} plan
          </div>
        </header>

        <DashboardSummary data={data} />
        <CreateWorkspaceForm />
        <WorkspaceList workspaces={data.workspaces} />
        <RecentProjects projects={data.projects} />
      </div>
    </AppShell>
  );
}
