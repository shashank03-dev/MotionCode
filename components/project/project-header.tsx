import { Archive, GitBranch } from "lucide-react";

import { formatDate, type ProjectPageData } from "@/app/dashboard/data";

import { ArchiveProjectButton } from "./archive-project-button";

type ProjectHeaderProps = {
  data: ProjectPageData;
};

export function ProjectHeader({ data }: ProjectHeaderProps) {
  const canArchive = data.project.status !== "archived";

  return (
    <header className="border-b border-[#56544966] pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 border border-[#56544966] px-2 py-1 text-xs uppercase tracking-[0.18em] text-[#8f887a]">
            <GitBranch className="size-3.5" />
            {data.project.source_type}
          </div>
          <h1 className="font-mono text-3xl text-[#fffbf4] sm:text-4xl">
            {data.project.title}
          </h1>
          {data.project.description ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b8af9d]">
              {data.project.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border border-[#56544966] bg-[#15160f] px-4 py-3 text-sm">
            <div className="text-[#8f887a]">Status</div>
            <div className="mt-1 font-mono text-[#fffbf4]">
              {data.project.status}
            </div>
          </div>
          <div className="border border-[#56544966] bg-[#15160f] px-4 py-3 text-sm">
            <div className="text-[#8f887a]">Updated</div>
            <div className="mt-1 font-mono text-[#fffbf4]">
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
