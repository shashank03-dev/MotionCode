import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { formatDate, type ProjectRow } from "@/app/dashboard/data";

type RecentProjectsProps = {
  projects: ProjectRow[];
};

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <section id="projects" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-lg text-[var(--text)]">Projects</h2>
        <Link
          href="/workspaces"
          className="font-mono text-xs text-[var(--accent)] transition hover:text-[var(--text)]"
        >
          Browse workspaces
        </Link>
      </div>

      {projects.length ? (
        <div className="overflow-hidden border border-[var(--border)] bg-[#15160f]/82 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-[#0f100c] font-mono text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-normal">Name</th>
                <th className="hidden px-4 py-3 font-normal sm:table-cell">
                  Source
                </th>
                <th className="hidden px-4 py-3 font-normal md:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 font-normal">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="transition hover:bg-[var(--accent-dim)]"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center gap-2 text-[var(--text)] transition hover:text-[#00ff88]"
                    >
                      {project.title}
                      <ArrowUpRight className="size-4 text-[var(--muted)]" />
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-[var(--accent)] sm:table-cell">
                    {project.source_type}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <span className="border border-[var(--border)] bg-[#11120d] px-2 py-1 font-mono text-xs text-[var(--accent)]">
                      {project.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--muted)]">
                    {formatDate(project.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-[var(--border)] bg-[#15160f]/82 px-4 py-5 text-sm text-[var(--accent)] shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
          <p>No projects yet.</p>
          <Link
            href="/app"
            className="mt-4 inline-flex h-9 items-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-3 font-mono text-xs text-[var(--text)] transition hover:border-[var(--accent)]"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Analyze motion
          </Link>
        </div>
      )}
    </section>
  );
}
