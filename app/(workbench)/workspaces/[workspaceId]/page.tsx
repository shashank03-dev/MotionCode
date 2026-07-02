import { Sparkles } from "lucide-react";
import Link from "next/link";

import { WorkspaceFiles } from "@/components/workspace/workspace-files";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceMembers } from "@/components/workspace/workspace-members";
import { UpgradeGate } from "@/components/app/UpgradeGate";

import {
  getWorkspaceDesktopData,
  requireDashboardUser,
  resolvePlanGate,
} from "@/app/dashboard/data";

export const dynamic = "force-dynamic";

type WorkspacePageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await params;
  const user = await requireDashboardUser(`/workspaces/${workspaceId}`);
  const { isPaid } = await resolvePlanGate(user.id);
  if (!isPaid) {
    return <UpgradeGate feature="Workspaces" />;
  }
  const data = await getWorkspaceDesktopData(workspaceId, user);
  const newAnalysisHref = `/app?ws=${data.workspace.id}`;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Breadcrumb"
          className="font-mono text-xs text-[var(--muted)]"
        >
          <Link
            href="/workspaces"
            className="text-[var(--accent)] transition hover:text-[var(--text)]"
          >
            Workspaces
          </Link>
          {" / "}
          <span className="text-[var(--text)]">{data.workspace.name}</span>
        </nav>
        <Link
          href={newAnalysisHref}
          className="inline-flex h-9 items-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-3 font-mono text-xs text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          New analysis
        </Link>
      </div>

      <WorkspaceHeader data={data} />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <WorkspaceFiles
          projects={data.projects}
          sequenceCounts={data.sequenceCounts}
          newAnalysisHref={newAnalysisHref}
        />
        <WorkspaceMembers
          members={data.members}
          ownerId={data.workspace.owner_id}
        />
      </div>
    </div>
  );
}
