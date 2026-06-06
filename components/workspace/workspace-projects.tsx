import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { formatDate, type ProjectRow } from "@/app/dashboard/data";

type WorkspaceProjectsProps = {
  projects: ProjectRow[];
};

export function WorkspaceProjects({ projects }: WorkspaceProjectsProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-mono text-lg text-[#fffbf4]">Projects</h2>
      {projects.length ? (
        <div className="divide-y divide-[#56544966] border border-[#56544966]">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="grid gap-3 bg-[#15160f] px-4 py-4 transition hover:bg-[#1a1b12] sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#fffbf4]">
                  {project.title}
                  <ArrowUpRight className="size-4 text-[#8f887a]" />
                </div>
                <div className="mt-1 text-sm text-[#8f887a]">
                  {project.description || project.source_type}
                </div>
              </div>
              <div className="text-xs text-[#8f887a]">
                {project.status} · {formatDate(project.updated_at)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-[#56544966] bg-[#15160f] px-4 py-5 text-sm text-[#b8af9d]">
          No projects yet.
        </div>
      )}
    </section>
  );
}
