"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";

import type { AnalysisResult } from "@/lib/contracts/motion";
import {
  createExportBundle,
  type ExportArtifact,
  type ExportOptions,
} from "@/lib/exporters";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

type ExportPanelProps = ExportOptions & {
  analysis: AnalysisResult | null;
  className?: string;
};

export function ExportPanel({
  analysis,
  className,
  projectTitle,
  versionLabel,
  versionNumber,
}: ExportPanelProps) {
  const artifacts = useMemo(
    () =>
      analysis
        ? createExportBundle(analysis, {
            projectTitle,
            versionLabel,
            versionNumber,
          })
        : [],
    [analysis, projectTitle, versionLabel, versionNumber],
  );
  const [selectedFramework, setSelectedFramework] =
    useState<ExportArtifact["framework"]>("markdown");
  const [copiedFramework, setCopiedFramework] =
    useState<ExportArtifact["framework"] | null>(null);
  const selected =
    artifacts.find((artifact) => artifact.framework === selectedFramework) ??
    artifacts[0];

  async function copyArtifact(artifact: ExportArtifact) {
    await navigator.clipboard.writeText(artifact.code);
    setCopiedFramework(artifact.framework);
    window.setTimeout(() => setCopiedFramework(null), 1600);
  }

  function downloadArtifact(artifact: ExportArtifact) {
    const blob = new Blob([artifact.code], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = artifact.filename;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  if (!analysis || !selected) {
    return (
      <section className={cn("rounded-lg border border-zinc-800 p-5", className)}>
        <h2 className="text-lg font-semibold text-zinc-100">Exports</h2>
        <p className="mt-2 text-sm text-zinc-400">
          No generated outputs are attached to this shared version.
        </p>
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-zinc-800 p-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Exports</h2>
          <p className="text-sm text-zinc-400">
            Markdown brief and implementation helpers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            aria-label={`Copy ${selected.filename}`}
            onClick={() => copyArtifact(selected)}
            size="icon"
            title={`Copy ${selected.filename}`}
            variant="outline"
          >
            {copiedFramework === selected.framework ? <Check /> : <Copy />}
          </Button>
          <Button
            aria-label={`Download ${selected.filename}`}
            onClick={() => downloadArtifact(selected)}
            size="icon"
            title={`Download ${selected.filename}`}
            variant="outline"
          >
            <Download />
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist">
        {artifacts.map((artifact) => (
          <button
            aria-selected={selected.framework === artifact.framework}
            className={cn(
              "h-8 rounded-md border px-3 text-sm transition-colors",
              selected.framework === artifact.framework
                ? "border-emerald-400 bg-emerald-400/10 text-emerald-100"
                : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100",
            )}
            key={artifact.framework}
            onClick={() => setSelectedFramework(artifact.framework)}
            role="tab"
            type="button"
          >
            {artifactLabel(artifact)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <pre className="max-h-[32rem] overflow-auto rounded-lg bg-zinc-950 p-4 text-sm leading-6 text-zinc-100">
          <code>{selected.code}</code>
        </pre>
        <aside className="space-y-4 rounded-lg border border-zinc-800 p-4">
          <ArtifactNotes title="Dependencies" values={selected.dependencies} />
          <ArtifactNotes title="Setup" values={selected.setupNotes} />
          <ArtifactNotes title="Accessibility" values={selected.accessibilityNotes} />
          <ArtifactNotes title="Warnings" values={selected.warnings} />
        </aside>
      </div>
    </section>
  );
}

function ArtifactNotes({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-200">{title}</h3>
      {values.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-zinc-400">
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">None</p>
      )}
    </div>
  );
}

function artifactLabel(artifact: ExportArtifact) {
  if (artifact.framework === "markdown") {
    return "Brief";
  }

  if (artifact.framework === "framer-motion") {
    return "Framer";
  }

  if (artifact.framework === "react-spring") {
    return "Spring";
  }

  return artifact.framework.toUpperCase();
}
