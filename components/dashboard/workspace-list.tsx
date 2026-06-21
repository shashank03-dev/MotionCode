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
        <h2 className="font-mono text-lg text-[var(--text)]">Workspaces</h2>
        <div className="flex items-center gap-3">
          <Link
            href="/workspaces"
            className="font-mono text-xs text-[var(--accent)] transition hover:text-[var(--text)]"
          >
            View index
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex size-8 items-center justify-center border border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--text)] transition hover:border-[var(--accent)]"
            title="New workspace"
          >
            <Plus className="size-4" />
          </Link>
        </div>
      </div>

      {workspaces.length ? (
        <div className="divide-y divide-[var(--border)] border border-[var(--border)] bg-[#15160f]/82 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="grid gap-2 px-4 py-4 transition hover:bg-[var(--accent-dim)] sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  {workspace.name}
                  <ArrowUpRight className="size-4 text-[var(--muted)]" />
                </div>
                <div className="mt-1 font-mono text-xs text-[var(--muted)]">
                  {workspace.slug}
                </div>
              </div>
              <div className="font-mono text-xs text-[var(--muted)]">
                {formatDate(workspace.updated_at)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-[var(--border)] bg-[#15160f]/82 px-4 py-5 text-sm text-[var(--accent)] shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
          No workspaces yet.
        </div>
      )}
    </section>
  );
}
