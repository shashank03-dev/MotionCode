import { Sparkles } from "lucide-react";
import Link from "next/link";

import { ProjectHeader } from "@/components/project/project-header";
import { SavedAnalysisViewer } from "@/components/project/saved-analysis-viewer";
import { VersionDetail } from "@/components/project/version-detail";
import { VersionTimeline } from "@/components/project/version-timeline";
import { UpgradeGate } from "@/components/app/UpgradeGate";
import { EmptyState, Pill, SectionLabel } from "@/components/ui/kit";
import { ButtonLink } from "@/components/ui/site-button";
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
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-ink-3">
          <Link href="/workspaces" className="transition-colors hover:text-ink">
            Workspaces
          </Link>
          <span className="px-1.5">/</span>
          <Link
            href={`/workspaces/${data.workspace.id}`}
            className="transition-colors hover:text-ink"
          >
            {data.workspace.name}
          </Link>
          <span className="px-1.5">/</span>
          <span className="text-ink">{data.project.title}</span>
        </nav>
        {canWrite ? (
          <ButtonLink href={newSequenceHref} variant="primary" size="sm">
            <Sparkles className="size-4" aria-hidden="true" />
            New sequence
          </ButtonLink>
        ) : null}
      </div>

      <ProjectHeader data={data} />

      {savedResult ? (
        <section className="space-y-4">
          <SectionLabel
            actions={
              latestVersion ? (
                <Pill tone="muted">v{latestVersion.version_number}</Pill>
              ) : null
            }
          >
            Latest sequence
          </SectionLabel>
          <SavedAnalysisViewer
            result={savedResult}
            newAnalysisHref={newSequenceHref}
          />
        </section>
      ) : latestVersion ? (
        <VersionDetail version={latestVersion} />
      ) : (
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title="No sequences yet"
          description="Run an analysis and it will be saved here as this project's first sequence — spec, preview, and generated code included."
          action={
            canWrite ? (
              <ButtonLink href={newSequenceHref} variant="primary" size="sm">
                <Sparkles className="size-4" aria-hidden="true" />
                Analyze motion
              </ButtonLink>
            ) : null
          }
        />
      )}

      <VersionTimeline projectId={data.project.id} versions={data.versions} />
    </div>
  );
}
