"use client";

import { RotateCw } from "lucide-react";
import { useState } from "react";

import type { ConsoleEntry, PreviewMode } from "@/lib/preview/types";
import { cn } from "@/lib/utils";

import { ConsolePanel } from "./ConsolePanel";

export type PreviewStatus = "idle" | "running" | "ready" | "error" | "timeout";

type PreviewPaneProps = {
  srcDoc: string;
  runId: number;
  status: PreviewStatus;
  /** Whether the code or the spec-based fallback is playing (null while running). */
  mode: PreviewMode | null;
  /** Active framework tab, shown in the status strip. */
  frameworkLabel: string;
  elapsedMs: number | null;
  consoleEntries: ConsoleEntry[];
  errorCount: number;
  onClearConsole: () => void;
  onReplay: () => void;
  iframeRef: React.RefObject<HTMLIFrameElement>;
};

type PreviewTab = "preview" | "console";

const STATUS_TEXT: Record<PreviewStatus, string> = {
  idle: "STANDING BY",
  running: "RUNNING",
  ready: "READY",
  error: "ERROR",
  timeout: "TIMED OUT",
};

export function PreviewPane({
  srcDoc,
  runId,
  status,
  mode,
  frameworkLabel,
  elapsedMs,
  consoleEntries,
  errorCount,
  onClearConsole,
  onReplay,
  iframeRef,
}: PreviewPaneProps) {
  const [tab, setTab] = useState<PreviewTab>("preview");

  return (
    <section
      className="flex h-full min-h-0 min-w-0 flex-col bg-[#121210]"
      aria-label="Live preview"
    >
      {/* Tab bar */}
      <div className="flex items-center justify-between gap-2 border-b border-hairline px-2">
        <div className="flex items-center" role="tablist" aria-label="Preview view">
          <PreviewTabButton
            active={tab === "preview"}
            onClick={() => setTab("preview")}
            label="Preview"
          />
          <PreviewTabButton
            active={tab === "console"}
            onClick={() => setTab("console")}
            label="Console"
            badge={errorCount > 0 ? errorCount : undefined}
          />
        </div>
        <button
          type="button"
          onClick={onReplay}
          title="Re-run preview"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 px-2 font-mono text-[11px] text-ink-3 transition hover:text-ink"
        >
          <RotateCw className="size-3.5" />
          <span className="hidden sm:inline">Replay</span>
        </button>
      </div>

      {/* Body */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className={cn("absolute inset-0", tab === "preview" ? "block" : "hidden")}>
          <iframe
            key={runId}
            ref={iframeRef}
            title="Animation preview"
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            className="h-full w-full border-0 bg-[#121210]"
          />
        </div>
        <div className={cn("absolute inset-0", tab === "console" ? "block" : "hidden")}>
          <ConsolePanel entries={consoleEntries} onClear={onClearConsole} />
        </div>
      </div>

      {/* Status strip — wraps so elapsed/version never collide on narrow. */}
      <div className="flex flex-wrap items-center justify-between gap-1 border-t border-hairline px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            status === "error" || status === "timeout" ? "text-[#f0506e]" : "text-ink-3",
          )}
        >
          <span
            className={cn(
              "inline-flex size-1.5 rounded-full",
              status === "ready"
                ? "bg-accent"
                  : status === "error" || status === "timeout"
                  ? "bg-[#f0506e]"
                  : status === "running"
                    ? "bg-[#ffd166]"
                    : "bg-[var(--muted)]",
            )}
          />
          {STATUS_TEXT[status]}
          {status === "ready" && elapsedMs !== null ? ` · ${elapsedMs}MS` : ""}
        </span>
        <span className="inline-flex items-center gap-2 text-ink-3">
          {status === "ready" && mode === "fallback" ? (
            <button
              type="button"
              onClick={() => setTab("console")}
              title="This code couldn't be rendered directly, so the preview plays the motion spec instead. Open the console for details."
              className="rounded-sm border border-[#ffd166]/40 px-1.5 py-0.5 text-[#ffd166] transition hover:border-[#ffd166]"
            >
              Spec preview
            </button>
          ) : null}
          <span>{frameworkLabel}</span>
        </span>
      </div>
    </section>
  );
}

function PreviewTabButton({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative min-h-[44px] px-3 py-2 font-mono text-[11px] transition-colors",
        active ? "text-ink" : "text-ink-3 hover:text-ink",
      )}
    >
      {label}
      {badge ? (
        <span className="ml-1.5 inline-flex h-4 min-w-3.5 items-center justify-center rounded-full bg-[#f0506e]/20 px-1 text-[10px] text-[#f0506e]">
          {badge}
        </span>
      ) : null}
      {active ? <span className="absolute inset-x-2 bottom-0 h-px bg-accent" /> : null}
    </button>
  );
}
