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
      <h2 className="font-mono text-lg text-[var(--text)]">Versions</h2>
      {versions.length ? (
        <div className="divide-y divide-[var(--border)] border border-[var(--border)] bg-[#15160f]/82 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
          {versions.map((version) => (
            <Link
              key={version.id}
              href={`/projects/${projectId}/versions/${version.id}`}
              className="grid gap-3 px-4 py-4 transition hover:bg-[var(--accent-dim)] sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="flex items-center gap-3">
                <GitCommit className="size-4 text-[var(--accent)]" />
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                    v{version.version_number}
                    {version.label ? ` / ${version.label}` : null}
                    <ArrowUpRight className="size-4 text-[var(--muted)]" />
                  </div>
                  <div className="mt-1 font-mono text-xs text-[var(--muted)]">
                    {formatVersionId(version.id)}
                  </div>
                </div>
              </div>
              <div className="font-mono text-xs text-[var(--muted)]">
                {formatDate(version.created_at)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-[var(--border)] bg-[#15160f]/82 px-4 py-5 text-sm text-[var(--accent)] shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
          No versions yet.
        </div>
      )}
    </section>
  );
}

function formatVersionId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}
