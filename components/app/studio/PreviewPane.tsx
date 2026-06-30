"use client";

import { RotateCw } from "lucide-react";
import { useState } from "react";

import type { ConsoleEntry } from "@/lib/preview/types";
import { cn } from "@/lib/utils";

import { ConsolePanel } from "./ConsolePanel";

export type PreviewStatus = "idle" | "running" | "ready" | "error";

type PreviewPaneProps = {
  srcDoc: string;
  runId: number;
  status: PreviewStatus;
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
};

export function PreviewPane({
  srcDoc,
  runId,
  status,
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
      className="flex h-full min-h-0 min-w-0 flex-col bg-[#0b0c08]"
      aria-label="Live preview"
    >
      {/* Tab bar */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-2">
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
          className="inline-flex h-7 items-center gap-1.5 px-2 font-mono text-[11px] text-[var(--muted)] transition hover:text-[var(--text)]"
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
            className="h-full w-full border-0 bg-[#11120D]"
          />
        </div>
        <div className={cn("absolute inset-0", tab === "console" ? "block" : "hidden")}>
          <ConsolePanel entries={consoleEntries} onClear={onClearConsole} />
        </div>
      </div>

      {/* Status strip */}
      <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            status === "error" ? "text-[#f58f7c]" : "text-[var(--muted)]",
          )}
        >
          <span
            className={cn(
              "inline-flex size-1.5 rounded-full",
              status === "ready"
                ? "bg-[#00ff88]"
                : status === "error"
                  ? "bg-[#f58f7c]"
                  : status === "running"
                    ? "bg-[#ffd166]"
                    : "bg-[var(--muted)]",
            )}
          />
          {STATUS_TEXT[status]}
          {status === "ready" && elapsedMs !== null ? ` · ${elapsedMs}MS` : ""}
        </span>
        <span className="text-[var(--muted)]">v1.0.0</span>
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
        "relative px-3 py-2 font-mono text-[11px] transition-colors",
        active ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--accent)]",
      )}
    >
      {label}
      {badge ? (
        <span className="ml-1.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#f58f7c]/20 px-1 text-[9px] text-[#f58f7c]">
          {badge}
        </span>
      ) : null}
      {active ? <span className="absolute inset-x-2 bottom-0 h-px bg-[#00ff88]" /> : null}
    </button>
  );
}
