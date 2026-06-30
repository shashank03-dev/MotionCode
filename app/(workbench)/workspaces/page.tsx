import { Plus } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/dashboard/app-shell";
import { WorkspaceList } from "@/components/dashboard/workspace-list";
import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";

import { getDashboardData, requireDashboardUser } from "../dashboard/data";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  const user = await requireDashboardUser("/workspaces");
  const data = await getDashboardData(user);

  return (
    <AppShell active="workspaces" userEmail={user.email}>
      <div className="space-y-7">
        <header className="grid gap-5 border-b border-[var(--border)] pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Workspace index
            </p>
            <h1 className="mt-3 max-w-3xl font-mono text-3xl leading-tight text-[var(--text)] sm:text-4xl">
              Teams, client spaces, and motion libraries.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--accent)]">
              Keep projects organized by workspace, then move straight into
              analysis when a reference is ready.
            </p>
          </div>
          <Link
            href="#new-workspace"
            className="inline-flex h-10 items-center justify-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-mono text-sm text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            <Plus className="size-4" aria-hidden="true" />
            New workspace
          </Link>
        </header>

        <div id="new-workspace">
          <CreateWorkspaceForm />
        </div>
        <WorkspaceList workspaces={data.workspaces} />
      </div>
    </AppShell>
  );
}
