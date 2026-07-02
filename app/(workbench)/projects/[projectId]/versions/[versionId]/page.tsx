import Link from "next/link";

import { ProjectHeader } from "@/components/project/project-header";
import { SavedAnalysisViewer } from "@/components/project/saved-analysis-viewer";
import { VersionDetail } from "@/components/project/version-detail";
import { VersionTimeline } from "@/components/project/version-timeline";
import { UpgradeGate } from "@/components/app/UpgradeGate";
import { parseSavedAnalysisResult } from "@/lib/contracts/savedAnalysis";

import {
  getVersionPageData,
  requireDashboardUser,
  resolvePlanGate,
} from "@/app/dashboard/data";

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
  );
  const { isPaid } = await resolvePlanGate(user.id);
  if (!isPaid) {
    return <UpgradeGate feature="Projects" />;
  }
  const data = await getVersionPageData(projectId, versionId, user);
  const savedResult = parseSavedAnalysisResult(data.version.motion_spec);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <nav
        aria-label="Breadcrumb"
        className="font-mono text-xs text-[var(--muted)]"
      >
        <Link
          href={`/workspaces/${data.workspace.id}`}
          className="text-[var(--accent)] transition hover:text-[var(--text)]"
        >
          {data.workspace.name}
        </Link>
        {" / "}
        <Link
          href={`/projects/${data.project.id}`}
          className="text-[var(--accent)] transition hover:text-[var(--text)]"
        >
          {data.project.title}
        </Link>
        {" / "}
        <span className="text-[var(--text)]">
          v{data.version.version_number}
        </span>
      </nav>

      <ProjectHeader data={data} />

      {savedResult ? (
        <section className="space-y-3">
          <h2 className="font-mono text-lg text-[var(--text)]">
            Sequence v{data.version.version_number}
            {data.version.label ? (
              <span className="ml-2 font-mono text-xs text-[var(--muted)]">
                {data.version.label}
              </span>
            ) : null}
          </h2>
          <SavedAnalysisViewer
            result={savedResult}
            newAnalysisHref={`/app?project=${data.project.id}`}
          />
        </section>
      ) : (
        <VersionDetail version={data.version} />
      )}

      <VersionTimeline projectId={data.project.id} versions={data.versions} />
    </div>
  );
}
