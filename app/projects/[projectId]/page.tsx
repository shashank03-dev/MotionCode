import { AppShell } from "@/components/dashboard/app-shell";
import { CreateVersionForm } from "@/components/project/create-version-form";
import { ProjectHeader } from "@/components/project/project-header";
import { VersionTimeline } from "@/components/project/version-timeline";

import { getProjectPageData, requireDashboardUser } from "../../dashboard/data";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: {
    projectId: string;
  };
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const user = await requireDashboardUser();
  const data = await getProjectPageData(params.projectId, user);
  const canWrite =
    data.project.owner_id === user.id ||
    data.role === "owner" ||
    (data.workspace.plan_tier === "studio" && data.role === "admin");

  return (
    <AppShell active="projects" userEmail={user.email}>
      <div className="mx-auto max-w-6xl space-y-8">
        <ProjectHeader data={data} />
        {canWrite ? <CreateVersionForm projectId={data.project.id} /> : null}
        <VersionTimeline projectId={data.project.id} versions={data.versions} />
      </div>
    </AppShell>
  );
}
