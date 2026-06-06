import { ArrowUpRight, Plus } from "lucide-react";
import Link from "next/link";

import { formatDate, type WorkspaceRow } from "@/app/dashboard/data";

type WorkspaceListProps = {
  workspaces: WorkspaceRow[];
};

export function WorkspaceList({ workspaces }: WorkspaceListProps) {
  return (
    <section id="workspaces" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-mono text-lg text-[#fffbf4]">Workspaces</h2>
        <Link
          href="/onboarding"
          className="inline-flex size-8 items-center justify-center border border-[#d8cfbc66] text-[#d8cfbc]"
          title="New workspace"
        >
          <Plus className="size-4" />
        </Link>
      </div>

      {workspaces.length ? (
        <div className="divide-y divide-[#56544966] border border-[#56544966]">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="grid gap-2 bg-[#15160f] px-4 py-4 transition hover:bg-[#1a1b12] sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#fffbf4]">
                  {workspace.name}
                  <ArrowUpRight className="size-4 text-[#8f887a]" />
                </div>
                <div className="mt-1 font-mono text-xs text-[#8f887a]">
                  {workspace.slug}
                </div>
              </div>
              <div className="text-xs text-[#8f887a]">
                {formatDate(workspace.updated_at)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-[#56544966] bg-[#15160f] px-4 py-5 text-sm text-[#b8af9d]">
          No workspaces yet.
        </div>
      )}
    </section>
  );
}
