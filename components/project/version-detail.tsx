import type { ProjectVersionRow } from "@/app/dashboard/data";
import { Panel, Pill } from "@/components/ui/kit";

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
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-medium tracking-tight text-ink">
          v{version.version_number}
        </h2>
        <Pill tone="muted">{version.label ?? formatVersionId(version.id)}</Pill>
      </div>
      <p className="text-[14px] leading-6 text-ink-2">
        This sequence was saved as a raw motion spec, so the studio preview is
        unavailable. Newer sequences open as the full result.
      </p>
      <Panel variant="glass" inset="none" radius="2xl" className="overflow-hidden">
        <pre className="max-h-[560px] overflow-auto p-5 font-mono text-xs leading-6 text-ink-2">
          {JSON.stringify(version.motion_spec, null, 2)}
        </pre>
      </Panel>
    </section>
  );
}

function formatVersionId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}
