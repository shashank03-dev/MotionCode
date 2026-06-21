import Link from "next/link";

import { AppShell } from "@/components/dashboard/app-shell";
import { ProjectHeader } from "@/components/project/project-header";
import { VersionDetail } from "@/components/project/version-detail";
import { VersionTimeline } from "@/components/project/version-timeline";

import {
  getVersionPageData,
  requireDashboardUser,
} from "../../../../dashboard/data";

export const dynamic = "force-dynamic";

type VersionPageProps = {
  params: Promise<{
    projectId: string;
    versionId: string;
  }>;
};

export default async function VersionPage({ params }: VersionPageProps) {
  const { projectId, versionId } = await params;
  const user = await requireDashboardUser(
    `/projects/${projectId}/versions/${versionId}`,
    { paidOnly: true },
  );
  const data = await getVersionPageData(projectId, versionId, user);

  return (
    <AppShell active="projects" userEmail={user.email}>
      <div className="mx-auto max-w-6xl space-y-8">
        <Link
          href={`/projects/${data.project.id}`}
          className="inline-flex font-mono text-sm text-[var(--accent)] transition hover:text-[var(--text)]"
        >
          Back to project
        </Link>
        <ProjectHeader data={data} />
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <VersionDetail data={data} />
          <VersionTimeline projectId={data.project.id} versions={data.versions} />
        </div>
      </div>
    </AppShell>
  );
}
