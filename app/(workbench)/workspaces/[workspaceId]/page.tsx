import { CreateProjectForm } from "@/components/project/create-project-form";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceMembers } from "@/components/workspace/workspace-members";
import { WorkspaceProjects } from "@/components/workspace/workspace-projects";
import { UpgradeGate } from "@/components/app/UpgradeGate";

import {
  getWorkspacePageData,
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
  const data = await getWorkspacePageData(workspaceId, user);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <WorkspaceHeader data={data} />
      <CreateProjectForm workspaceId={data.workspace.id} />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <WorkspaceProjects projects={data.projects} />
        <WorkspaceMembers
          members={data.members}
          ownerId={data.workspace.owner_id}
        />
      </div>
    </div>
  );
}
