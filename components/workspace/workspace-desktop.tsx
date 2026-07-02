import { Folder } from "lucide-react";
import Link from "next/link";

import { formatDate, type WorkspaceFolderSummary } from "@/app/dashboard/data";

type WorkspaceDesktopProps = {
  folders: WorkspaceFolderSummary[];
};

/**
 * Desktop-style folder grid: every workspace the user can open, rendered as a
 * folder. Clicking a folder opens the workspace's saved analyses — nothing
 * here starts a new analysis.
 */
export function WorkspaceDesktop({ folders }: WorkspaceDesktopProps) {
  if (folders.length === 0) {
    return (
      <div className="border border-dashed border-[var(--border)] bg-[#15160f]/60 px-5 py-10 text-center">
        <p className="font-mono text-sm text-[var(--text)]">
          No workspaces yet.
        </p>
        <p className="mt-2 text-sm text-[var(--accent)]">
          Create your first workspace above — analyses you run get saved into
          it automatically.
        </p>
      </div>
    );
  }

  return (
    <ul
      aria-label="Workspaces"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {folders.map(({ projectCount, recentProjects, workspace }) => (
        <li key={workspace.id}>
          <Link
            href={`/workspaces/${workspace.id}`}
            className="group flex h-full flex-col gap-4 border border-[var(--border)] bg-[#15160f]/82 px-5 py-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition hover:border-[var(--accent-border)] hover:bg-[var(--accent-dim)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            <Folder
              className="size-10 text-[var(--accent)] transition group-hover:text-[#00ff88]"
              strokeWidth={1.25}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2 className="truncate font-mono text-sm text-[var(--text)]">
                {workspace.name}
              </h2>
              <p className="mt-1 font-mono text-[11px] text-[var(--muted)]">
                {projectCount} {projectCount === 1 ? "analysis" : "analyses"} ·{" "}
                {formatDate(workspace.updated_at)}
              </p>
            </div>
            {recentProjects.length > 0 ? (
              <ul className="mt-auto space-y-1 border-t border-[var(--border)] pt-3">
                {recentProjects.map((project) => (
                  <li
                    key={project.id}
                    className="truncate font-mono text-[11px] text-[var(--accent)]"
                  >
                    {project.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-auto border-t border-[var(--border)] pt-3 font-mono text-[11px] text-[var(--muted)]">
                Empty folder
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
