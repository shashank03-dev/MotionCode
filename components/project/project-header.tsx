import { Archive, GitBranch } from "lucide-react";

import { formatDate, type ProjectPageData } from "@/app/dashboard/data";

import { ArchiveProjectButton } from "./archive-project-button";

type ProjectHeaderProps = {
  data: ProjectPageData;
};

export function ProjectHeader({ data }: ProjectHeaderProps) {
  const canArchive = data.project.status !== "archived";

  return (
    <header className="border-b border-[var(--border)] pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 border border-[var(--border)] bg-[var(--accent-dim)] px-2 py-1 font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
            <GitBranch className="size-3.5" />
            {data.project.source_type}
          </div>
          <h1 className="font-mono text-3xl text-[var(--text)] sm:text-4xl">
            {data.project.title}
          </h1>
          {data.project.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--accent)]">
              {data.project.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border border-[var(--border)] bg-[#15160f]/82 px-4 py-3 text-sm shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
            <div className="text-[var(--muted)]">Status</div>
            <div className="mt-1 font-mono text-[var(--text)]">
              {data.project.status}
            </div>
          </div>
          <div className="border border-[var(--border)] bg-[#15160f]/82 px-4 py-3 text-sm shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
            <div className="text-[var(--muted)]">Updated</div>
            <div className="mt-1 font-mono text-[var(--text)]">
              {formatDate(data.project.updated_at)}
            </div>
          </div>
          {canArchive ? (
            <ArchiveProjectButton projectId={data.project.id}>
              <Archive className="size-4" />
              Archive
            </ArchiveProjectButton>
          ) : null}
        </div>
      </div>
    </header>
  );
}
