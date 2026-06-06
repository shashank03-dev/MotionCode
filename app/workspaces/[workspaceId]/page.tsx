import { AppShell } from "@/components/dashboard/app-shell";
import { CreateProjectForm } from "@/components/project/create-project-form";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceMembers } from "@/components/workspace/workspace-members";
import { WorkspaceProjects } from "@/components/workspace/workspace-projects";

import { getWorkspacePageData, requireDashboardUser } from "../../dashboard/data";

export const dynamic = "force-dynamic";

type WorkspacePageProps = {
  params: {
    workspaceId: string;
  };
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const user = await requireDashboardUser();
  const data = await getWorkspacePageData(params.workspaceId, user);

  return (
    <AppShell active="workspaces" userEmail={user.email}>
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
    </AppShell>
  );
}
