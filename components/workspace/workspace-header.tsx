import { Building2 } from "lucide-react";

import { formatDate, type WorkspacePageData } from "@/app/dashboard/data";
import { Eyebrow, Pill, StatTile } from "@/components/ui/kit";

type WorkspaceHeaderProps = {
  data: WorkspacePageData;
};

export function WorkspaceHeader({ data }: WorkspaceHeaderProps) {
  return (
    <header className="grid gap-6 border-b border-hairline pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <Eyebrow>Workspace</Eyebrow>
          <Pill tone="accent">
            <Building2 className="size-3" aria-hidden="true" />
            {data.role}
          </Pill>
        </div>
        <h1 className="mt-3 truncate font-display text-3xl font-medium leading-[1.05] tracking-tightest text-ink sm:text-[2.6rem]">
          {data.workspace.name}
        </h1>
        <p className="mt-2.5 font-mono text-[13px] text-ink-3">
          {data.workspace.slug}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:w-80">
        <StatTile label="Plan" value={data.workspace.plan_tier} />
        <StatTile
          label="Updated"
          value={
            <span className="text-xl">{formatDate(data.workspace.updated_at)}</span>
          }
        />
      </div>
    </header>
  );
}
