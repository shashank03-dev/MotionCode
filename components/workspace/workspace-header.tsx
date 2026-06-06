import { Building2 } from "lucide-react";

import { formatDate, type WorkspacePageData } from "@/app/dashboard/data";

type WorkspaceHeaderProps = {
  data: WorkspacePageData;
};

export function WorkspaceHeader({ data }: WorkspaceHeaderProps) {
  return (
    <header className="border-b border-[#56544966] pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 border border-[#56544966] px-2 py-1 text-xs uppercase tracking-[0.18em] text-[#8f887a]">
            <Building2 className="size-3.5" />
            {data.role}
          </div>
          <h1 className="font-mono text-3xl text-[#fffbf4] sm:text-4xl">
            {data.workspace.name}
          </h1>
          <p className="mt-2 font-mono text-sm text-[#8f887a]">
            {data.workspace.slug}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="border border-[#56544966] bg-[#15160f] px-4 py-3">
            <div className="text-[#8f887a]">Plan</div>
            <div className="mt-1 font-mono text-[#fffbf4]">
              {data.workspace.plan_tier}
            </div>
          </div>
          <div className="border border-[#56544966] bg-[#15160f] px-4 py-3">
            <div className="text-[#8f887a]">Updated</div>
            <div className="mt-1 font-mono text-[#fffbf4]">
              {formatDate(data.workspace.updated_at)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
