"use client";

import { PanelLeftClose, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import { MotionSpecPanel } from "@/components/app/MotionSpecPanel";
import { Scorecard } from "@/components/app/Scorecard";
import type { ScoreKey } from "@/components/app/types";
import type { AnalysisResult } from "@/lib/contracts/motion";
import {
  CODE_TABS,
  type CodeTab,
  getDownloadFilename,
  getFrameworkForTab,
  getGeneratedOutput,
  prettifyCode,
} from "@/lib/generatedCode";
import type { MotionSpecEditableField } from "@/lib/motionSpecEditor";
import { buildPreviewDoc } from "@/lib/preview/buildPreviewDoc";
import type { ConsoleEntry, ConsoleLevel } from "@/lib/preview/types";
import { isPreviewMessage } from "@/lib/preview/types";
import { cn } from "@/lib/utils";

import type { EditorLanguage } from "./CodeMirrorEditor";
import { EditorPane } from "./EditorPane";
import { PreviewPane, type PreviewStatus } from "./PreviewPane";

type AnalyzeStudioProps = {
  result: AnalysisResult;
  intentColor: string;
  activeTab: CodeTab;
  /** When false (free tier) the studio is read-only: preview + copy only. */
  editable: boolean;
  onTabChange: (tab: CodeTab) => void;
  onNewAnalysis: () => void;
  onSpecChange: (field: MotionSpecEditableField, value: unknown) => void;
};

function seedFromResult(result: AnalysisResult): Record<CodeTab, string> {
  return CODE_TABS.reduce(
    (acc, tab) => {
      acc[tab] = getGeneratedOutput(result, tab)?.code ?? "";
      return acc;
    },
    {} as Record<CodeTab, string>,
  );
}

function languageForTab(tab: CodeTab): EditorLanguage {
  return tab === "CSS" ? "css" : "javascript";
}

export function AnalyzeStudio({
  result,
  intentColor,
  activeTab,
  editable,
  onTabChange,
  onNewAnalysis,
  onSpecChange,
}: AnalyzeStudioProps) {
  // Seeded from the result via the useState initializer. AppShell remounts this
  // component (key={result.id}) on each new analysis, so no seeding effect is needed.
  const [original] = useState<Record<CodeTab, string>>(() => seedFromResult(result));
  const [editorCode, setEditorCode] = useState<Record<CodeTab, string>>(() =>
    seedFromResult(result),
  );
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredScore, setHoveredScore] = useState<ScoreKey | null>(null);

  // Preview runtime state.
  const [srcDoc, setSrcDoc] = useState("");
  const [runId, setRunId] = useState(0);
  const [status, setStatus] = useState<PreviewStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const runIdRef = useRef(0);
  const runStartRef = useRef(0);
  const consoleIdRef = useRef(0);

  const errorCount = useMemo(
    () => consoleEntries.filter((entry) => entry.level === "error").length,
    [consoleEntries],
  );

  const run = useCallback(
    (tab: CodeTab, code: string) => {
      const nextRunId = runIdRef.current + 1;
      runIdRef.current = nextRunId;
      runStartRef.current = performance.now();

      const doc = buildPreviewDoc({
        framework: getFrameworkForTab(tab),
        code,
        runId: nextRunId,
        spec: {
          durationMs: result.spec.durationMs,
          delayMs: result.spec.delayMs,
          easing: result.spec.easing,
          loops: result.spec.loops,
          element: result.spec.element,
          intent: result.spec.intent,
        },
      });

      setConsoleEntries([]);
      setElapsedMs(null);
      setStatus("running");
      setRunId(nextRunId);
      setSrcDoc(doc);
    },
    [result.spec],
  );

  // Kick off the preview on mount and re-run it when switching framework tabs.
  // This synchronizes the external iframe runtime with editor state — the
  // legitimate role of an effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    run(activeTab, editorCode[activeTab] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Listen for messages from the preview iframe.
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!isPreviewMessage(data)) return;
      if (data.runId !== runIdRef.current) return;

      if (data.type === "ready") {
        setElapsedMs(Math.max(0, Math.round(performance.now() - runStartRef.current)));
        setStatus((current) => (current === "error" ? "error" : "ready"));
        return;
      }
      if (data.type === "console") {
        appendConsole(data.level, data.text);
        return;
      }
      if (data.type === "error") {
        appendConsole("error", data.text);
        setStatus("error");
      }
    };

    function appendConsole(level: ConsoleLevel, text: string) {
      consoleIdRef.current += 1;
      setConsoleEntries((current) => [
        ...current.slice(-199),
        { id: consoleIdRef.current, level, text, at: Date.now() },
      ]);
    }

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const activeCode = editorCode[activeTab] ?? "";
  const dirty = activeCode !== (original[activeTab] ?? "");

  const handleChange = useCallback(
    (code: string) => {
      setEditorCode((current) => ({ ...current, [activeTab]: code }));
    },
    [activeTab],
  );

  const handleRun = useCallback(() => {
    run(activeTab, editorCode[activeTab] ?? "");
  }, [activeTab, editorCode, run]);

  const handleFormat = useCallback(() => {
    setEditorCode((current) => ({
      ...current,
      [activeTab]: prettifyCode(current[activeTab] ?? "", activeTab),
    }));
  }, [activeTab]);

  const handleReset = useCallback(() => {
    const code = original[activeTab] ?? "";
    setEditorCode((current) => ({ ...current, [activeTab]: code }));
    run(activeTab, code);
  }, [activeTab, original, run]);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(editorCode[activeTab] ?? "");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [activeTab, editorCode]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([editorCode[activeTab] ?? ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getDownloadFilename(activeTab);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [activeTab, editorCode]);

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Studio header */}
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[#0d0f0b]/80 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="inline-flex size-2 shrink-0 rounded-full"
            style={{ backgroundColor: intentColor }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              Studio · {result.spec.intent}
            </p>
            <h2 className="truncate font-mono text-sm text-[var(--text)]">
              {result.spec.element}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-mono text-[11px] transition",
              drawerOpen
                ? "border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--text)]"
                : "border-[var(--border)] text-[var(--accent)] hover:text-[var(--text)]",
            )}
          >
            <SlidersHorizontal className="size-3.5" />
            Spec &amp; audit
          </button>
          <button
            type="button"
            onClick={onNewAnalysis}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 font-mono text-[11px] text-[var(--accent)] transition hover:border-[var(--accent-border)] hover:text-[var(--text)]"
          >
            <PanelLeftClose className="size-3.5" />
            New analysis
          </button>
        </div>
      </header>

      {/* Split body */}
      <div className="min-h-0 flex-1">
        <PanelGroup direction="horizontal" autoSaveId="motioncode-studio-split">
          <Panel defaultSize={50} minSize={28} className="min-w-0">
            <EditorPane
              tabs={CODE_TABS}
              activeTab={activeTab}
              onTabChange={onTabChange}
              value={activeCode}
              language={languageForTab(activeTab)}
              dirty={dirty}
              copied={copied}
              editable={editable}
              onChange={handleChange}
              onRun={handleRun}
              onFormat={handleFormat}
              onReset={handleReset}
              onCopy={handleCopy}
              onDownload={handleDownload}
            />
          </Panel>
          <PanelResizeHandle className="group relative w-px bg-[var(--border)] outline-none data-[resize-handle-state=hover]:bg-[#00ff88] data-[resize-handle-state=drag]:bg-[#00ff88]">
            <span className="absolute inset-y-0 -left-1 -right-1 z-10" />
          </PanelResizeHandle>
          <Panel defaultSize={50} minSize={28} className="min-w-0">
            <PreviewPane
              srcDoc={srcDoc}
              runId={runId}
              status={status}
              elapsedMs={elapsedMs}
              consoleEntries={consoleEntries}
              errorCount={errorCount}
              onClearConsole={() => setConsoleEntries([])}
              onReplay={handleRun}
              iframeRef={iframeRef}
            />
          </Panel>
        </PanelGroup>
      </div>

      {/* Spec & audit drawer */}
      {drawerOpen ? (
        <div className="absolute inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-[var(--border)] bg-[#0d0f0b] shadow-[0_0_60px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">
              Spec &amp; audit
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="font-mono text-[11px] text-[var(--accent)] hover:text-[var(--text)]"
            >
              Close
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
            <MotionSpecPanel
              editable={editable}
              intentColor={intentColor}
              onReset={onNewAnalysis}
              onSpecChange={onSpecChange}
              result={result}
            />
            <Scorecard
              hoveredScore={hoveredScore}
              onHoveredScoreChange={setHoveredScore}
              spec={result.spec}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
