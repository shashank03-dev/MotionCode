import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { formatDate, type ProjectRow } from "@/app/dashboard/data";

type RecentProjectsProps = {
  projects: ProjectRow[];
};

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <section id="projects" className="space-y-3">
      <h2 className="font-mono text-lg text-[#fffbf4]">Projects</h2>

      {projects.length ? (
        <div className="overflow-hidden border border-[#56544966]">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-[#15160f] text-xs uppercase tracking-[0.16em] text-[#8f887a]">
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
            <tbody className="divide-y divide-[#56544966] bg-[#15160f]">
              {projects.map((project) => (
                <tr key={project.id} className="transition hover:bg-[#1a1b12]">
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center gap-2 text-[#fffbf4]"
                    >
                      {project.title}
                      <ArrowUpRight className="size-4 text-[#8f887a]" />
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-[#b8af9d] sm:table-cell">
                    {project.source_type}
                  </td>
                  <td className="hidden px-4 py-3 text-[#b8af9d] md:table-cell">
                    {project.status}
                  </td>
                  <td className="px-4 py-3 text-[#8f887a]">
                    {formatDate(project.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-[#56544966] bg-[#15160f] px-4 py-5 text-sm text-[#b8af9d]">
          No projects yet.
        </div>
      )}
    </section>
  );
}
