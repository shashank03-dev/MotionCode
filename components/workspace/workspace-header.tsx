import { Building2 } from "lucide-react";

import { formatDate, type WorkspacePageData } from "@/app/dashboard/data";

type WorkspaceHeaderProps = {
  data: WorkspacePageData;
};

export function WorkspaceHeader({ data }: WorkspaceHeaderProps) {
  return (
    <header className="border-b border-[var(--border)] pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 border border-[var(--border)] bg-[var(--accent-dim)] px-2 py-1 font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
            <Building2 className="size-3.5" />
            {data.role}
          </div>
          <h1 className="font-mono text-3xl text-[var(--text)] sm:text-4xl">
            {data.workspace.name}
          </h1>
          <p className="mt-2 font-mono text-sm text-[var(--muted)]">
            {data.workspace.slug}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="border border-[var(--border)] bg-[#15160f]/82 px-4 py-3 shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
            <div className="text-[var(--muted)]">Plan</div>
            <div className="mt-1 font-mono text-[var(--text)]">
              {data.workspace.plan_tier}
            </div>
          </div>
          <div className="border border-[var(--border)] bg-[#15160f]/82 px-4 py-3 shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
            <div className="text-[var(--muted)]">Updated</div>
            <div className="mt-1 font-mono text-[var(--text)]">
              {formatDate(data.workspace.updated_at)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
