import { Folder } from "lucide-react";
import Link from "next/link";

import { formatDate, type WorkspaceFolderSummary } from "@/app/dashboard/data";
import { EmptyState, Panel } from "@/components/ui/kit";

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
      <EmptyState
        icon={<Folder className="size-5" strokeWidth={1.5} />}
        title="No workspaces yet"
        description="Create your first workspace above — analyses you run get saved into it automatically."
      />
    );
  }

  return (
    <ul
      aria-label="Workspaces"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {folders.map(({ projectCount, recentProjects, workspace }) => (
        <li key={workspace.id}>
          <Panel
            as="div"
            variant="glass"
            inset="none"
            radius="2xl"
            interactive
            className="h-full"
          >
            <Link
              href={`/workspaces/${workspace.id}`}
              className="group flex h-full flex-col gap-4 rounded-2xl px-5 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-border)]"
            >
              <Folder
                className="size-9 text-ink-3 transition-colors duration-300 group-hover:text-accent"
                strokeWidth={1.25}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h2 className="truncate font-display text-[15px] font-medium tracking-tight text-ink">
                  {workspace.name}
                </h2>
                <p className="mt-1 font-mono text-[11px] text-ink-3">
                  {projectCount} {projectCount === 1 ? "analysis" : "analyses"} ·{" "}
                  {formatDate(workspace.updated_at)}
                </p>
              </div>
              {recentProjects.length > 0 ? (
                <ul className="mt-auto space-y-1 border-t border-hairline pt-3">
                  {recentProjects.map((project) => (
                    <li
                      key={project.id}
                      className="truncate font-mono text-[11px] text-ink-2"
                    >
                      {project.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-auto border-t border-hairline pt-3 font-mono text-[11px] text-ink-3">
                  Empty folder
                </p>
              )}
            </Link>
          </Panel>
        </li>
      ))}
    </ul>
  );
}
