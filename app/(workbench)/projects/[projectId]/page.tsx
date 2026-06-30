import { CreateVersionForm } from "@/components/project/create-version-form";
import { ProjectHeader } from "@/components/project/project-header";
import { VersionTimeline } from "@/components/project/version-timeline";
import { UpgradeGate } from "@/components/app/UpgradeGate";

import {
  getProjectPageData,
  requireDashboardUser,
  resolvePlanGate,
} from "@/app/dashboard/data";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const user = await requireDashboardUser(`/projects/${projectId}`);
  const { isPaid } = await resolvePlanGate(user.id);
  if (!isPaid) {
    return <UpgradeGate feature="Projects" />;
  }
  const data = await getProjectPageData(projectId, user);
  const canWrite =
    data.project.owner_id === user.id ||
    data.role === "owner" ||
    (data.workspace.plan_tier === "studio" && data.role === "admin");

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <ProjectHeader data={data} />
      {canWrite ? <CreateVersionForm projectId={data.project.id} /> : null}
      <VersionTimeline projectId={data.project.id} versions={data.versions} />
    </div>
  );
}
