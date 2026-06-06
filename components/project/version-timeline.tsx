import { ArrowUpRight, GitCommit } from "lucide-react";
import Link from "next/link";

import { formatDate, type ProjectVersionRow } from "@/app/dashboard/data";

type VersionTimelineProps = {
  projectId: string;
  versions: ProjectVersionRow[];
};

export function VersionTimeline({ projectId, versions }: VersionTimelineProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-mono text-lg text-[#fffbf4]">Versions</h2>
      {versions.length ? (
        <div className="divide-y divide-[#56544966] border border-[#56544966]">
          {versions.map((version) => (
            <Link
              key={version.id}
              href={`/projects/${projectId}/versions/${version.id}`}
              className="grid gap-3 bg-[#15160f] px-4 py-4 transition hover:bg-[#1a1b12] sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="flex items-center gap-3">
                <GitCommit className="size-4 text-[#8f887a]" />
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#fffbf4]">
                    v{version.version_number}
                    {version.label ? ` · ${version.label}` : null}
                    <ArrowUpRight className="size-4 text-[#8f887a]" />
                  </div>
                  <div className="mt-1 font-mono text-xs text-[#8f887a]">
                    {version.id}
                  </div>
                </div>
              </div>
              <div className="text-xs text-[#8f887a]">
                {formatDate(version.created_at)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-[#56544966] bg-[#15160f] px-4 py-5 text-sm text-[#b8af9d]">
          No versions yet.
        </div>
      )}
    </section>
  );
}
