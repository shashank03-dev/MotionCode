import { FileCode2, Sparkles } from "lucide-react";
import Link from "next/link";

import { formatDate, type ProjectRow } from "@/app/dashboard/data";

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
      <section className="flex flex-col items-start gap-3 border border-dashed border-[var(--border)] bg-[#15160f]/60 px-5 py-8">
        <h2 className="font-mono text-lg text-[var(--text)]">
          This workspace is empty
        </h2>
        <p className="max-w-xl text-sm leading-6 text-[var(--accent)]">
          Run an analysis and the result lands here automatically — saved as a
          project with its full history of sequences.
        </p>
        <Link
          href={newAnalysisHref}
          className="mt-2 inline-flex h-9 items-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-3 font-mono text-xs text-[var(--text)] transition hover:border-[var(--accent)]"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          New analysis
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="font-mono text-lg text-[var(--text)]">Saved analyses</h2>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const sequences = sequenceCounts[project.id] ?? 0;
          return (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="group flex h-full flex-col gap-3 border border-[var(--border)] bg-[#15160f]/82 px-5 py-5 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-dim)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
              >
                <FileCode2
                  className="size-7 text-[var(--accent)] transition group-hover:text-[#00ff88]"
                  strokeWidth={1.25}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <h3 className="truncate font-mono text-sm text-[var(--text)]">
                    {project.title}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">
                    {sequences} {sequences === 1 ? "sequence" : "sequences"} ·{" "}
                    {project.status}
                  </p>
                </div>
                <p className="mt-auto border-t border-[var(--border)] pt-3 font-mono text-[11px] text-[var(--muted)]">
                  Updated {formatDate(project.updated_at)}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
