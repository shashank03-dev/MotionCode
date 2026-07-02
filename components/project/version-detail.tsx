import type { ProjectVersionRow } from "@/app/dashboard/data";

type VersionDetailProps = {
  version: ProjectVersionRow;
};

/**
 * Fallback rendering for sequences saved before analyzer auto-save (spec-only
 * or hand-pasted payloads). Sequences saved by the analyzer render through
 * SavedAnalysisViewer instead.
 */
export function VersionDetail({ version }: VersionDetailProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-mono text-lg text-[var(--text)]">
          v{version.version_number}
        </h2>
        <div className="font-mono text-xs text-[var(--muted)]">
          {version.label ?? formatVersionId(version.id)}
        </div>
      </div>
      <p className="font-mono text-xs text-[var(--muted)]">
        This sequence was saved as a raw motion spec, so the studio preview is
        unavailable. Newer sequences open as the full result.
      </p>
      <pre className="max-h-[560px] overflow-auto border border-[var(--border)] bg-[#15160f]/82 p-4 font-mono text-xs leading-6 text-[var(--accent)] shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
        {JSON.stringify(version.motion_spec, null, 2)}
      </pre>
    </section>
  );
}

function formatVersionId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}
