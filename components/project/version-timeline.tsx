import { ArrowUpRight, GitCommit } from "lucide-react";
import Link from "next/link";

import { formatDate, type ProjectVersionRow } from "@/app/dashboard/data";
import { EmptyState, Panel, SectionLabel } from "@/components/ui/kit";

type VersionTimelineProps = {
  projectId: string;
  versions: ProjectVersionRow[];
};

export function VersionTimeline({ projectId, versions }: VersionTimelineProps) {
  return (
    <section className="space-y-4">
      <SectionLabel>Versions</SectionLabel>
      {versions.length ? (
        <Panel
          variant="glass"
          inset="none"
          radius="2xl"
          className="divide-y divide-hairline overflow-hidden"
        >
          {versions.map((version) => (
            <Link
              key={version.id}
              href={`/projects/${projectId}/versions/${version.id}`}
              className="group grid gap-3 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-hairline bg-white/[0.03] text-ink-3 transition-colors group-hover:border-accent-border group-hover:text-accent">
                  <GitCommit className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-ink">
                    v{version.version_number}
                    {version.label ? (
                      <span className="text-ink-2">/ {version.label}</span>
                    ) : null}
                    <ArrowUpRight className="size-3.5 text-ink-3 transition-colors group-hover:text-accent" />
                  </div>
                  <div className="mt-0.5 font-mono text-xs text-ink-3">
                    {formatVersionId(version.id)}
                  </div>
                </div>
              </div>
              <div className="font-mono text-xs text-ink-3">
                {formatDate(version.created_at)}
              </div>
            </Link>
          ))}
        </Panel>
      ) : (
        <EmptyState
          icon={<GitCommit className="size-5" />}
          title="No versions yet"
          description="Each time you save an analysis to this project, it lands here as a new version."
        />
      )}
    </section>
  );
}

function formatVersionId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}
