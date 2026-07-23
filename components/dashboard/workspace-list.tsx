import { ArrowUpRight, Boxes, Plus } from "lucide-react";
import Link from "next/link";

import { formatDate, type WorkspaceRow } from "@/app/dashboard/data";
import { EmptyState, Panel, SectionLabel } from "@/components/ui/kit";

type WorkspaceListProps = {
  workspaces: WorkspaceRow[];
};

export function WorkspaceList({ workspaces }: WorkspaceListProps) {
  return (
    <section id="workspaces" className="space-y-4">
      <SectionLabel
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/workspaces"
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink"
            >
              View index →
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex size-7 items-center justify-center rounded-lg border border-hairline text-ink-2 transition hover:border-accent-border hover:bg-accent-dim hover:text-ink"
              title="New workspace"
            >
              <Plus className="size-4" />
            </Link>
          </div>
        }
      >
        Workspaces
      </SectionLabel>

      {workspaces.length ? (
        <Panel variant="glass" inset="none" radius="2xl" className="divide-y divide-hairline overflow-hidden">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="group grid gap-2 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-ink">
                  {workspace.name}
                  <ArrowUpRight className="size-3.5 text-ink-3 transition-colors group-hover:text-accent" />
                </div>
                <div className="mt-1 font-mono text-xs text-ink-3">{workspace.slug}</div>
              </div>
              <div className="font-mono text-xs text-ink-3">
                {formatDate(workspace.updated_at)}
              </div>
            </Link>
          ))}
        </Panel>
      ) : (
        <EmptyState
          icon={<Boxes className="size-5" />}
          title="No workspaces yet"
          description="Workspaces group your projects and let you collaborate with a team."
        />
      )}
    </section>
  );
}
