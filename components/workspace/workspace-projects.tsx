import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { formatDate, type ProjectRow } from "@/app/dashboard/data";

type WorkspaceProjectsProps = {
  projects: ProjectRow[];
};

export function WorkspaceProjects({ projects }: WorkspaceProjectsProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-mono text-lg text-[var(--text)]">Projects</h2>
      {projects.length ? (
        <div className="divide-y divide-[var(--border)] border border-[var(--border)] bg-[#15160f]/82 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="grid gap-3 px-4 py-4 transition hover:bg-[var(--accent-dim)] sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  {project.title}
                  <ArrowUpRight className="size-4 text-[var(--muted)]" />
                </div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  {project.description || project.source_type}
                </div>
              </div>
              <div className="font-mono text-xs text-[var(--muted)]">
                {project.status} / {formatDate(project.updated_at)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-[var(--border)] bg-[#15160f]/82 px-4 py-5 text-sm text-[var(--accent)] shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
          No projects yet.
        </div>
      )}
    </section>
  );
}
