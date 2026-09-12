"use client";

import { PanelLeftClose, SlidersHorizontal } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  /** Optional status pill rendered in the header (e.g. workspace save state). */
  saveSlot?: ReactNode;
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
  saveSlot,
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
  // Narrow (stacked) mode shows one pane at a time behind Code/Preview tabs
  // instead of a fixed-height vertical split, so the container stays auto.
  const [mobilePane, setMobilePane] = useState<"code" | "preview">("code");

  // Preview runtime state.
  const [srcDoc, setSrcDoc] = useState("");
  const [runId, setRunId] = useState(0);
  const [status, setStatus] = useState<PreviewStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const runIdRef = useRef(0);
  const runStartRef = useRef(0);
  const consoleIdRef = useRef(0);
  const previewTimeoutRef = useRef<number | null>(null);

  const errorCount = useMemo(
    () => consoleEntries.filter((entry) => entry.level === "error").length,
    [consoleEntries],
  );

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Workbench section tabs (mobile top bar) drive the narrow Code/Preview
  // tabs via a window event so the pane switches before scrolling to it.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<"code" | "preview">).detail;
      if (detail === "code" || detail === "preview") {
        setMobilePane(detail);
      }
    };
    window.addEventListener(
      "workbench:studio-pane",
      handler as EventListener,
    );
    return () =>
      window.removeEventListener(
        "workbench:studio-pane",
        handler as EventListener,
      );
  }, []);

  const run = useCallback(
    (tab: CodeTab, code: string) => {
      const nextRunId = runIdRef.current + 1;
      runIdRef.current = nextRunId;
      runStartRef.current = performance.now();
      if (previewTimeoutRef.current !== null) {
        window.clearTimeout(previewTimeoutRef.current);
      }

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
      previewTimeoutRef.current = window.setTimeout(() => {
        if (runIdRef.current === nextRunId) setStatus("timeout");
      }, 8000);
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
      const currentWindow = iframeRef.current?.contentWindow;
      if (event.source !== currentWindow) {
        // The iframe remounts on each run (srcDoc change), so its contentWindow
        // can be null mid-remount when a legit "ready" arrives. Accept the
        // message when the runId matches and the source is non-null; only drop
        // when a non-null source positively differs from a non-null window
        // (or when the source itself is null and unverifiable).
        if (event.source == null) return;
        if (currentWindow != null) return;
      }

      if (data.type === "ready") {
        if (previewTimeoutRef.current !== null) {
          window.clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }
        setElapsedMs(Math.max(0, Math.round(performance.now() - runStartRef.current)));
        setStatus((current) => (current === "error" ? "error" : "ready"));
        return;
      }
      if (data.type === "console") {
        appendConsole(data.level, data.text);
        return;
      }
      if (data.type === "error") {
        if (previewTimeoutRef.current !== null) {
          window.clearTimeout(previewTimeoutRef.current);
          previewTimeoutRef.current = null;
        }
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
    return () => {
      window.removeEventListener("message", handler);
      if (previewTimeoutRef.current !== null) {
        window.clearTimeout(previewTimeoutRef.current);
      }
    };
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
      {/* Studio header — wraps on small screens; labels collapse to icons
          below sm so the cluster never pushes the title out. */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-[#0a0b0d]/80 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="inline-flex size-2 shrink-0 rounded-full"
            style={{ backgroundColor: intentColor }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3">
              Studio · {result.spec.intent}
            </p>
            <h2 className="truncate font-display text-[15px] font-medium tracking-tight text-ink">
              {result.spec.element}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveSlot}
          <button
            type="button"
            onClick={() => setDrawerOpen((open) => !open)}
            aria-label="Toggle spec and audit panel"
            aria-expanded={drawerOpen}
            aria-controls="spec-audit-drawer"
            className={cn(
              "inline-flex min-h-[44px] items-center gap-1.5 rounded-md border px-2.5 font-mono text-[11px] transition sm:min-h-0 sm:h-8",
              drawerOpen
                ? "border-[var(--accent-border)] bg-[var(--accent-dim)] text-ink"
                : "border-hairline text-ink-2 hover:text-ink",
            )}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Spec &amp; audit</span>
          </button>
          <button
            type="button"
            onClick={onNewAnalysis}
            aria-label="Start new analysis"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-hairline px-2.5 font-mono text-[11px] text-ink-2 transition hover:border-[var(--accent-border)] hover:text-ink sm:min-h-0 sm:h-8"
          >
            <PanelLeftClose className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">New analysis</span>
          </button>
        </div>
      </header>

      {/* Split body. Desktop keeps the resizable horizontal split. Narrow
          stacks via Code/Preview tabs with auto height so each pane sizes to
          its content instead of a fixed 70vh vertical split. */}
      <div className="min-h-0 flex-1">
        {isNarrow ? (
          <div className="flex flex-col">
            <div
              role="tablist"
              aria-label="Studio view"
              className="flex items-center gap-1 border-b border-hairline px-2"
            >
              {(
                [
                  { key: "code", label: "Code" },
                  { key: "preview", label: "Preview" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={mobilePane === tab.key}
                  onClick={() => setMobilePane(tab.key)}
                  className={cn(
                    "relative min-h-[44px] shrink-0 px-4 font-mono text-[11px] transition-colors",
                    mobilePane === tab.key
                      ? "text-ink"
                      : "text-ink-3 hover:text-ink",
                  )}
                >
                  {tab.label}
                  {mobilePane === tab.key ? (
                    <span
                      className="absolute inset-x-2 bottom-0 h-px bg-accent"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              ))}
            </div>
            <div className="min-h-[320px]">
              <div
                id="studio-code"
                className={cn(
                  "min-h-[320px] scroll-mt-16",
                  mobilePane !== "code" && "hidden",
                )}
                aria-hidden={mobilePane !== "code"}
              >
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
              </div>
              <div
                id="studio-preview"
                className={cn(
                  "min-h-[320px] scroll-mt-16",
                  mobilePane !== "preview" && "hidden",
                )}
                aria-hidden={mobilePane !== "preview"}
              >
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
              </div>
            </div>
          </div>
        ) : (
          <PanelGroup
            direction="horizontal"
            autoSaveId="motioncode-studio-split-horizontal"
          >
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
            <PanelResizeHandle className="group relative w-px bg-[var(--border)] outline-none data-[resize-handle-state=hover]:bg-accent data-[resize-handle-state=drag]:bg-accent">
              {/* 24px+ grab area: -left-3/-right-3 keeps the 1px visual. */}
              <span className="absolute inset-y-0 -left-3 -right-3 z-10" />
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
        )}
      </div>

      {/* Spec & audit drawer — full-screen fixed sheet on mobile with
          safe-area padding, docked absolute panel on sm+. */}
      {drawerOpen ? (
        <div id="spec-audit-drawer" role="dialog" aria-label="Spec and audit" className="fixed inset-0 z-30 flex w-full flex-col overflow-y-auto border-hairline bg-[#0a0b0d] pb-[env(safe-area-inset-bottom)] shadow-[0_0_60px_rgba(0,0,0,0.5)] sm:absolute sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full sm:max-w-md sm:border-l sm:pb-0">
          <div className="flex min-h-[44px] items-center justify-between border-b border-hairline px-4 py-2.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3">
              Spec &amp; audit
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center font-mono text-[11px] text-ink-2 hover:text-ink"
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
