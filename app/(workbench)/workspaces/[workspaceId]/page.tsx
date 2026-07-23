import { Sparkles } from "lucide-react";
import Link from "next/link";

import { WorkspaceFiles } from "@/components/workspace/workspace-files";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceMembers } from "@/components/workspace/workspace-members";
import { UpgradeGate } from "@/components/app/UpgradeGate";
import { ButtonLink } from "@/components/ui/site-button";

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
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-ink-3">
          <Link href="/workspaces" className="transition-colors hover:text-ink">
            Workspaces
          </Link>
          <span className="px-1.5 text-ink-3">/</span>
          <span className="text-ink">{data.workspace.name}</span>
        </nav>
        <ButtonLink href={newAnalysisHref} variant="primary" size="sm">
          <Sparkles className="size-4" aria-hidden="true" />
          New analysis
        </ButtonLink>
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
