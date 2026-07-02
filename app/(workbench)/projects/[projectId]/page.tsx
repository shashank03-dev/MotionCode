import { Sparkles } from "lucide-react";
import Link from "next/link";

import { ProjectHeader } from "@/components/project/project-header";
import { SavedAnalysisViewer } from "@/components/project/saved-analysis-viewer";
import { VersionDetail } from "@/components/project/version-detail";
import { VersionTimeline } from "@/components/project/version-timeline";
import { UpgradeGate } from "@/components/app/UpgradeGate";
import { parseSavedAnalysisResult } from "@/lib/contracts/savedAnalysis";

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

  const latestVersion = data.versions[0] ?? null;
  const savedResult = latestVersion
    ? parseSavedAnalysisResult(latestVersion.motion_spec)
    : null;
  const newSequenceHref = `/app?project=${data.project.id}`;

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
          <Link
            href={`/workspaces/${data.workspace.id}`}
            className="text-[var(--accent)] transition hover:text-[var(--text)]"
          >
            {data.workspace.name}
          </Link>
          {" / "}
          <span className="text-[var(--text)]">{data.project.title}</span>
        </nav>
        {canWrite ? (
          <Link
            href={newSequenceHref}
            className="inline-flex h-9 items-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-3 font-mono text-xs text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            New sequence
          </Link>
        ) : null}
      </div>

      <ProjectHeader data={data} />

      {savedResult ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-mono text-lg text-[var(--text)]">
              Latest sequence
              {latestVersion ? (
                <span className="ml-2 font-mono text-xs text-[var(--muted)]">
                  v{latestVersion.version_number}
                </span>
              ) : null}
            </h2>
          </div>
          <SavedAnalysisViewer
            result={savedResult}
            newAnalysisHref={newSequenceHref}
          />
        </section>
      ) : latestVersion ? (
        <VersionDetail version={latestVersion} />
      ) : (
        <section className="flex flex-col items-start gap-3 border border-dashed border-[var(--border)] bg-[#15160f]/60 px-5 py-8">
          <h2 className="font-mono text-lg text-[var(--text)]">
            No sequences yet
          </h2>
          <p className="max-w-xl text-sm leading-6 text-[var(--accent)]">
            Run an analysis and it will be saved here as this project&apos;s
            first sequence — spec, preview, and generated code included.
          </p>
          {canWrite ? (
            <Link
              href={newSequenceHref}
              className="mt-2 inline-flex h-9 items-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-3 font-mono text-xs text-[var(--text)] transition hover:border-[var(--accent)]"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Analyze motion
            </Link>
          ) : null}
        </section>
      )}

      <VersionTimeline projectId={data.project.id} versions={data.versions} />
    </div>
  );
}
