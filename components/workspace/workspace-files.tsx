import { FileCode2, Sparkles } from "lucide-react";
import Link from "next/link";

import { formatDate, type ProjectRow } from "@/app/dashboard/data";
import { EmptyState, Panel, SectionLabel } from "@/components/ui/kit";
import { ButtonLink } from "@/components/ui/site-button";

type WorkspaceFilesProps = {
  projects: ProjectRow[];
  /** Saved sequences (versions) per project id. */
  sequenceCounts: Record<string, number>;
  /** Analyzer link carrying this workspace as the save destination. */
  newAnalysisHref: string;
};

/**
 * Opened-folder view: each saved analysis in the workspace rendered as a file.
 * Opening a file shows the saved result — a new analysis only starts from the
 * explicit "New analysis" tile/button.
 */
export function WorkspaceFiles({
  projects,
  sequenceCounts,
  newAnalysisHref,
}: WorkspaceFilesProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FileCode2 className="size-5" strokeWidth={1.5} />}
        title="This workspace is empty"
        description="Run an analysis and the result lands here automatically — saved as a project with its full history of sequences."
        action={
          <ButtonLink href={newAnalysisHref} variant="primary" size="sm">
            <Sparkles className="size-4" aria-hidden="true" />
            New analysis
          </ButtonLink>
        }
      />
    );
  }

  return (
    <section className="space-y-4">
      <SectionLabel>Saved analyses</SectionLabel>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const sequences = sequenceCounts[project.id] ?? 0;
          return (
            <li key={project.id}>
              <Panel
                as="div"
                variant="glass"
                inset="none"
                radius="2xl"
                interactive
                className="h-full"
              >
                <Link
                  href={`/projects/${project.id}`}
                  className="group flex h-full flex-col gap-3 rounded-2xl px-5 py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-border)]"
                >
                  <FileCode2
                    className="size-7 text-ink-3 transition-colors duration-300 group-hover:text-accent"
                    strokeWidth={1.25}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-[15px] font-medium tracking-tight text-ink">
                      {project.title}
                    </h3>
                    <p className="mt-1 font-mono text-[11px] text-ink-3">
                      {sequences} {sequences === 1 ? "sequence" : "sequences"} ·{" "}
                      {project.status}
                    </p>
                  </div>
                  <p className="mt-auto border-t border-hairline pt-3 font-mono text-[11px] text-ink-3">
                    Updated {formatDate(project.updated_at)}
                  </p>
                </Link>
              </Panel>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
