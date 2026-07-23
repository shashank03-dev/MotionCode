import { Archive, GitBranch } from "lucide-react";

import { formatDate, type ProjectPageData } from "@/app/dashboard/data";
import { Eyebrow, Pill, StatTile } from "@/components/ui/kit";

import { ArchiveProjectButton } from "./archive-project-button";

type ProjectHeaderProps = {
  data: ProjectPageData;
};

export function ProjectHeader({ data }: ProjectHeaderProps) {
  const canArchive = data.project.status !== "archived";

  return (
    <header className="grid gap-6 border-b border-hairline pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <Eyebrow>Project</Eyebrow>
          <Pill tone="accent">
            <GitBranch className="size-3" aria-hidden="true" />
            {data.project.source_type}
          </Pill>
        </div>
        <h1 className="mt-3 font-display text-3xl font-medium leading-[1.05] tracking-tightest text-balance text-ink sm:text-[2.6rem]">
          {data.project.title}
        </h1>
        {data.project.description ? (
          <p className="mt-3.5 max-w-2xl text-[15px] leading-7 text-ink-2 text-pretty">
            {data.project.description}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid grid-cols-2 gap-3 lg:w-72">
          <StatTile label="Status" value={data.project.status} />
          <StatTile
            label="Updated"
            value={
              <span className="text-xl">{formatDate(data.project.updated_at)}</span>
            }
          />
        </div>
        {canArchive ? (
          <ArchiveProjectButton projectId={data.project.id}>
            <Archive className="size-4" />
            Archive
          </ArchiveProjectButton>
        ) : null}
      </div>
    </header>
  );
}
