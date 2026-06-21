import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

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
      <div className="space-y-7">
        <header className="grid gap-5 border-b border-[var(--border)] pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Workspace home
            </p>
            <h1 className="mt-3 max-w-3xl font-mono text-3xl leading-tight text-[var(--text)] sm:text-4xl">
              Dashboard, projects, and analysis in one product frame.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--accent)]">
              Start a motion analysis, reopen recent work, or organize your team
              spaces without leaving the app.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="border border-[var(--border)] bg-[#15160f]/80 px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-[var(--accent)]">
              {data.profile?.plan_tier ?? "free"} plan
            </div>
            <Link
              href="/app"
              className="inline-flex h-10 items-center justify-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-mono text-sm text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Analyze motion
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
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
