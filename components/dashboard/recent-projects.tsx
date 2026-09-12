import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { formatDate, type ProjectRow } from "@/app/dashboard/data";
import { EmptyState, Panel, Pill, SectionLabel } from "@/components/ui/kit";
import { ButtonLink } from "@/components/ui/site-button";

type RecentProjectsProps = {
  projects: ProjectRow[];
};

export function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <section id="projects" className="space-y-4">
      <SectionLabel
        actions={
          <Link
            href="/workspaces"
            className="inline-block py-2 font-mono text-xs uppercase tracking-[0.14em] text-ink-3 transition-colors hover:text-ink"
          >
            Browse workspaces →
          </Link>
        }
      >
        Recent projects
      </SectionLabel>

      {projects.length ? (
        <Panel variant="glass" inset="none" radius="2xl" className="overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead className="border-b border-hairline font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-3">
              <tr>
                <th className="px-5 py-3.5 font-normal">Name</th>
                <th className="hidden px-5 py-3.5 font-normal sm:table-cell">Source</th>
                <th className="hidden px-5 py-3.5 font-normal md:table-cell">Status</th>
                <th className="px-5 py-3.5 text-right font-normal">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="group transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/projects/${project.id}`}
                      className="inline-flex items-center gap-2 font-medium text-ink transition-colors hover:text-accent"
                    >
                      {project.title}
                      <ArrowUpRight className="size-3.5 text-ink-3 transition-colors group-hover:text-accent" />
                    </Link>
                  </td>
                  <td className="hidden px-5 py-3.5 font-mono text-xs text-ink-3 sm:table-cell">
                    {project.source_type}
                  </td>
                  <td className="hidden px-5 py-3.5 md:table-cell">
                    <Pill tone="neutral">{project.status}</Pill>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs text-ink-3">
                    {formatDate(project.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Panel>
      ) : (
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title="No projects yet"
          description="Analyze a motion reference and save it to start building your project library."
          action={
            <ButtonLink href="/app" variant="primary" size="sm">
              <Sparkles className="size-4" aria-hidden="true" />
              Analyze motion
            </ButtonLink>
          }
        />
      )}
    </section>
  );
}
