"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppStatusBar } from "@/components/app/AppStatusBar";
import {
  DEFAULT_INTENT_COLOR,
  intentColorFor,
} from "@/components/app/intent-colors";
import { FreeSaveNoticeModal } from "@/components/app/FreeSaveNoticeModal";
import { ProcessCanvas } from "@/components/app/ProcessCanvas";
import { UploadPanel } from "@/components/app/UploadPanel";
import type { ApiResponse } from "@/lib/contracts/errors";
import type { AnalysisResult } from "@/lib/contracts/motion";
import {
  PLAN_ENTITLEMENTS,
  type PlanEntitlements,
  type PlanTier,
} from "@/lib/contracts/plans";
import { extractFrames, isSupportedMediaFile } from "@/lib/extractFrames";
import { CODE_TABS, type CodeTab } from "@/lib/generatedCode";
import type { MotionSpecEditableField } from "@/lib/motionSpecEditor";
import { updateAnalysisResultSpec } from "@/lib/motionSpecEditor";
import { incrementUsage, usagesLeft } from "@/lib/rateLimit";
import {
  saveAnalysisToWorkspace,
  type SaveAnalysisTarget,
} from "@/lib/workbench/saveAnalysis";

import styles from "./AppShell.module.css";
import type { AnalysisStage } from "./types";

const DEFAULT_ENTITLEMENTS = PLAN_ENTITLEMENTS.free;
const DEFAULT_FRAME_COUNT = DEFAULT_ENTITLEMENTS.maxFramesPerAnalysis;

// The result studio brings CodeMirror and its language packages with it. Keep
// that dependency tree out of the initial workbench path until an analysis has
// produced a result to display.
const AnalyzeStudio = dynamic(
  () => import("@/components/app/studio/AnalyzeStudio").then((module) => module.AnalyzeStudio),
  {
    loading: () => <AnalyzeStudioLoading />,
    ssr: false,
  },
);

// Free-tier "your work won't be saved" consent. Acknowledged once per session;
// the permanent key lets a user opt out of the reminder for good on this device.
const FREE_SAVE_ACK_SESSION_KEY = "motioncode_free_save_ack_session";
const FREE_SAVE_ACK_DISMISSED_KEY = "motioncode_free_save_ack_dismissed";

const STATUS_MESSAGES = [
  "Analyzing motion patterns...",
  "Reading easing curves...",
  "Detecting transform paths...",
  "Almost there...",
];

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; projectId: string }
  | { status: "error"; message: string };

type AppShellProps = {
  initialDailyAnalysisUsage?: {
    limit: number;
    remaining: number;
    used: number;
  };
  initialEntitlements?: PlanEntitlements;
  initialPlanTier?: PlanTier;
  /**
   * Where completed analyses are saved (paid tiers). A projectId appends a new
   * sequence to that project; a workspaceId creates a new project inside it.
   * Empty target falls back to the user's most recent workspace.
   */
  saveTarget?: SaveAnalysisTarget;
};

export function AppShell({
  initialDailyAnalysisUsage,
  initialEntitlements = DEFAULT_ENTITLEMENTS,
  initialPlanTier = DEFAULT_ENTITLEMENTS.tier,
  saveTarget,
}: AppShellProps = {}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileUrlRef = useRef<string | null>(null);
  const stepTimerRef = useRef<number | null>(null);
  const scannerTimerRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);

  // Plan tier and entitlements are owned by the server: the parent server
  // component resolves them fresh from the database and passes them as props, so
  // deriving them directly here means a server re-render (e.g. after an admin
  // upgrade/downgrade) updates the UI, the default model, and plan gating.
  const userPlan: PlanTier = initialPlanTier;
  const entitlements = initialEntitlements;
  // Free tier gets a read-only studio: preview + copy only. Paid tiers edit.
  const editable = userPlan !== "free";

  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(DEFAULT_FRAME_COUNT);
  const [frames, setFrames] = useState<string[]>([]);
  const [frameThumbs, setFrameThumbs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [stage, setStage] = useState<AnalysisStage>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<CodeTab>("CSS");
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [flashError, setFlashError] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [scannerIndex, setScannerIndex] = useState(0);
  const [statusBarMsgIndex, setStatusBarMsgIndex] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [serverUsageRemaining, setServerUsageRemaining] = useState<
    number | null
  >(initialDailyAnalysisUsage?.remaining ?? null);
  // True once the free-tier save warning has been acknowledged — permanently
  // (localStorage) or for the current session (sessionStorage). Resolved lazily
  // so a returning user is never prompted twice. Nothing renders from this value
  // before interaction, so reading storage during init causes no hydration drift.
  const [freeSaveAcknowledged, setFreeSaveAcknowledged] =
    useState(readFreeSaveAcknowledged);
  const [freeSaveModalOpen, setFreeSaveModalOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ status: "idle" });
  const pendingFileRef = useRef<File | null>(null);
  const saveRunRef = useRef(0);
  const extractionControllerRef = useRef<AbortController | null>(null);
  const analysisControllerRef = useRef<AbortController | null>(null);
  const operationIdRef = useRef(0);

  useEffect(() => {
    return () => {
      extractionControllerRef.current?.abort();
      analysisControllerRef.current?.abort();
    };
  }, []);

  const localUsageRemaining = usagesLeft(entitlements.dailyAnalyses);
  const usageRemaining =
    serverUsageRemaining === null
      ? localUsageRemaining
      : Math.min(localUsageRemaining, serverUsageRemaining);
  const canUseFree = userPlan !== "free" || usageRemaining > 0;

  const stepsList = [
    `Extracting ${frames.length || DEFAULT_FRAME_COUNT} frames from video...`,
    "Sending frames to server analysis...",
    "Detecting motion vectors...",
    "Analyzing easing curves...",
    "Identifying animation intent...",
    "Generating CSS keyframes...",
    "Generating GSAP timeline...",
    "Generating Framer Motion variants...",
    "Running performance audit...",
    "Checking accessibility compliance...",
    "Compiling output...",
  ];

  const showValidation = useCallback((message: string) => {
    setFlashError(true);
    setValidationError(message);
    window.setTimeout(() => setFlashError(false), 1500);
  }, []);

  const clearAnimationTimers = useCallback(() => {
    if (stepTimerRef.current !== null) {
      // stepTimerRef holds the progress interval while analyzing.
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    if (scannerTimerRef.current !== null) {
      clearInterval(scannerTimerRef.current);
      scannerTimerRef.current = null;
    }
    if (statusTimerRef.current !== null) {
      clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
  }, []);

  const revokeCurrentFileUrl = useCallback(() => {
    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
      fileUrlRef.current = null;
    }
    setFileUrl(null);
  }, []);

  const handleFileWithCount = useCallback(
    async (selectedFile: File, count: number) => {
      if (!isSupportedMediaFile(selectedFile)) {
        showValidation("Unsupported format. Use MP4, WebM, MOV, or GIF.");
        return;
      }

      if (selectedFile.size > entitlements.maxUploadBytes) {
        showValidation(
          `File is too large. Free uploads are limited to ${formatMegabytes(
            entitlements.maxUploadBytes,
          )} MB.`,
        );
        return;
      }

      setValidationError(null);
      extractionControllerRef.current?.abort();
      const controller = new AbortController();
      extractionControllerRef.current = controller;
      const operationId = operationIdRef.current + 1;
      operationIdRef.current = operationId;
      setFile(selectedFile);
      revokeCurrentFileUrl();

      const url = URL.createObjectURL(selectedFile);
      fileUrlRef.current = url;
      setFileUrl(url);
      setStage("extracting");
      setError(null);
      setResult(null);
      setFrames([]);
      setFrameThumbs([]);

      try {
        const extracted = await extractFrames(selectedFile, count, {
          maxBytes: entitlements.maxUploadBytes,
          maxFrames: entitlements.maxFramesPerAnalysis,
          signal: controller.signal,
        });
        if (operationId !== operationIdRef.current) return;
        setFrames(extracted);
        setFrameThumbs(extracted.map((frame) => `data:image/jpeg;base64,${frame}`));
        setStage("idle");
      } catch (caught) {
        if (isAbortError(caught) || operationId !== operationIdRef.current) return;
        const message =
          caught instanceof Error ? caught.message : "Failed to extract frames.";
        setStage("error");
        setError(message);
      }
    },
    [
      entitlements.maxFramesPerAnalysis,
      entitlements.maxUploadBytes,
      revokeCurrentFileUrl,
      showValidation,
    ],
  );

  const handleFile = useCallback(
    (selectedFile: File) => {
      void handleFileWithCount(selectedFile, frameCount);
    },
    [frameCount, handleFileWithCount],
  );

  // Entry point for every upload (file picker + drag/drop). Free-tier users see
  // the "won't be saved" notice once before their first analysis can proceed.
  const requestFile = useCallback(
    (selectedFile: File) => {
      if (userPlan === "free" && !freeSaveAcknowledged) {
        pendingFileRef.current = selectedFile;
        setFreeSaveModalOpen(true);
        return;
      }
      handleFile(selectedFile);
    },
    [freeSaveAcknowledged, handleFile, userPlan],
  );

  const handleFreeSaveConfirm = useCallback(
    (dontRemind: boolean) => {
      try {
        sessionStorage.setItem(FREE_SAVE_ACK_SESSION_KEY, "1");
        if (dontRemind) {
          localStorage.setItem(FREE_SAVE_ACK_DISMISSED_KEY, "1");
        }
      } catch {
        // Best-effort persistence; proceeding regardless of storage failure.
      }
      setFreeSaveAcknowledged(true);
      setFreeSaveModalOpen(false);
      const queued = pendingFileRef.current;
      pendingFileRef.current = null;
      if (queued) {
        handleFile(queued);
      }
    },
    [handleFile],
  );

  const handleFreeSaveCancel = useCallback(() => {
    setFreeSaveModalOpen(false);
    pendingFileRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleRemoveFile = useCallback(
    (event?: MouseEvent) => {
      event?.stopPropagation();
      extractionControllerRef.current?.abort();
      analysisControllerRef.current?.abort();
      operationIdRef.current += 1;
      setLoading(false);
      setFile(null);
      revokeCurrentFileUrl();
      setFrames([]);
      setFrameThumbs([]);
      setStage("idle");
      setResult(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [revokeCurrentFileUrl],
  );

  const handleReset = useCallback(() => {
    handleRemoveFile();
    setStage("idle");
    setResult(null);
    setError(null);
    setValidationError(null);
    setFrames([]);
    setFrameThumbs([]);
    setSaveState({ status: "idle" });
  }, [handleRemoveFile]);

  // Persist a completed analysis into the workbench (paid tiers only). Runs
  // fire-and-forget after the result is on screen: a save failure never blocks
  // the studio, it just surfaces as a "not saved" pill in the header.
  const persistAnalysis = useCallback(
    (analyzed: AnalysisResult) => {
      if (userPlan === "free") {
        return;
      }

      const runId = saveRunRef.current + 1;
      saveRunRef.current = runId;
      setSaveState({ status: "saving" });

      void saveAnalysisToWorkspace(analyzed, saveTarget).then((outcome) => {
        if (saveRunRef.current !== runId) {
          return;
        }
        if (outcome.ok) {
          setSaveState({ status: "saved", projectId: outcome.projectId });
          // The workbench explorer tree is server-rendered; refresh so the new
          // project/sequence shows up without a manual reload.
          router.refresh();
        } else {
          setSaveState({ status: "error", message: outcome.message });
        }
      });
    },
    [router, saveTarget, userPlan],
  );

  const updateFrameCount = useCallback(
    (count: number) => {
      setFrameCount(count);
      if (file) {
        void handleFileWithCount(file, count);
      }
    },
    [file, handleFileWithCount],
  );

  const handleAnalyze = useCallback(async () => {
    if (!frames.length || loading) {
      return;
    }

    if (userPlan === "free" && !canUseFree) {
      setError(
        `Daily limit reached (${entitlements.dailyAnalyses}/day). Upgrade with Razorpay for higher capacity.`,
      );
      setStage("error");
      return;
    }

    setLoading(true);
    analysisControllerRef.current?.abort();
    const controller = new AbortController();
    analysisControllerRef.current = controller;
    const operationId = operationIdRef.current + 1;
    operationIdRef.current = operationId;
    setStage("analyzing");
    setResult(null);
    setError(null);
    setStatusMessage("Analyzing with server model...");

    try {
      const analyzed = await analyzeViaApi({
        frames,
        planTier: userPlan,
        signal: controller.signal,
      });

      if (operationId !== operationIdRef.current) return;

      if (userPlan === "free") {
        incrementUsage();
        setServerUsageRemaining((current) =>
          current === null ? current : Math.max(0, current - 1),
        );
      }

      setResult(analyzed);
      setActiveTab(getStoredTab() ?? "CSS");
      setStage("done");
      setShowToast(true);
      persistAnalysis(analyzed);
    } catch (caught) {
      if (isAbortError(caught)) {
        if (operationId === operationIdRef.current) {
          setStage("idle");
          setStatusMessage("");
        }
        return;
      }
      if (operationId !== operationIdRef.current) return;
      setError(caught instanceof Error ? caught.message : "Analysis failed. Try again.");
      setStage("error");
    } finally {
      if (operationId === operationIdRef.current) {
        setLoading(false);
        analysisControllerRef.current = null;
      }
    }
  }, [
    canUseFree,
    entitlements.dailyAnalyses,
    frames,
    loading,
    persistAnalysis,
    userPlan,
  ]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      const selectedFile = event.dataTransfer.files?.[0];
      if (selectedFile) {
        requestFile(selectedFile);
      }
    },
    [requestFile],
  );

  const handleSpecChange = useCallback(
    (field: MotionSpecEditableField, value: unknown) => {
      setResult((current) =>
        current ? updateAnalysisResultSpec(current, field, value) : current,
      );
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        if (!loading && frames.length > 0 && stage !== "extracting") {
          void handleAnalyze();
        }
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        fileInputRef.current?.click();
      }

      if (["1", "2", "3", "4"].includes(event.key) && result) {
        setActiveTab(CODE_TABS[Number.parseInt(event.key, 10) - 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [frames.length, handleAnalyze, loading, result, stage]);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const savedTab = getStoredTab();
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    localStorage.setItem("motioncode_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (stage === "done" && result) {
      document.title = `${result.spec.intent} - ${result.spec.element} - MotionCode`;
    } else {
      document.title = "MotionCode - Turn Animations Into Production Code";
    }
  }, [stage, result]);

  useEffect(() => {
    if (!showToast) {
      return;
    }

    const timer = window.setTimeout(() => setShowToast(false), 3000);
    return () => window.clearTimeout(timer);
  }, [showToast]);

  useEffect(() => {
    let resetTimer: number | null = null;

    if (stage === "analyzing") {
      const total = Math.max(stepsList.length, 1);
      // Duration-aware progress. The real API call runs far longer than a fixed
      // timeline, so instead of racing to the end and freezing, progress eases
      // asymptotically toward a ceiling below 100 with an exponential curve:
      // fast at first, then ever slower, so it stays visibly "working" for any
      // call length without ever claiming completion. activeStep (and thus the
      // particle formation + phase text) is derived from that live value. The
      // jump to 100% is reserved for the actual resolve, handled on "done".
      const FLOOR = 6;
      const CEIL = 94;
      const TAU_MS = 7000;
      const startedAt =
        typeof performance !== "undefined" ? performance.now() : Date.now();

      const now = () =>
        typeof performance !== "undefined" ? performance.now() : Date.now();

      const tick = () => {
        const elapsed = now() - startedAt;
        const eased = 1 - Math.exp(-elapsed / TAU_MS);
        const value = FLOOR + (CEIL - FLOOR) * eased;
        setProgressWidth(value);
        const step = Math.min(
          total - 1,
          Math.round(((value - FLOOR) / (CEIL - FLOOR)) * (total - 1)),
        );
        setActiveStep(step);
      };

      resetTimer = window.setTimeout(() => {
        setScannerIndex(0);
        setStatusBarMsgIndex(0);
        tick();
      }, 0);
      // A short interval keeps the readout smooth while the exponential curve
      // does the pacing; it self-limits near the ceiling, so no runaway steps.
      stepTimerRef.current = window.setInterval(tick, 90);
      scannerTimerRef.current = window.setInterval(() => {
        setScannerIndex((current) => (current + 1) % (frames.length || 1));
      }, 300);
      statusTimerRef.current = window.setInterval(() => {
        setStatusBarMsgIndex((current) => (current + 1) % STATUS_MESSAGES.length);
      }, 3000);
    } else {
      clearAnimationTimers();
      if (stage !== "done") {
        resetTimer = window.setTimeout(() => setProgressWidth(0), 0);
      }
    }

    return () => {
      if (resetTimer !== null) {
        window.clearTimeout(resetTimer);
      }
      clearAnimationTimers();
    };
  }, [clearAnimationTimers, frames.length, stage, stepsList.length]);

  const intentColor = result
    ? intentColorFor(result.spec.intent)
    : DEFAULT_INTENT_COLOR;
  const processStage: Exclude<AnalysisStage, "done"> =
    stage === "done" ? "idle" : stage;
  const liveStatusMessage =
    stage === "analyzing" ? STATUS_MESSAGES[statusBarMsgIndex] : statusMessage;

  return (
    <div className={styles.root} id="app-root">
      <h1 className="sr-only">MotionCode animation converter</h1>

      <main className={styles.mainArea} id="main-area">
        <UploadPanel
          canUseFree={canUseFree}
          dragActive={dragActive}
          entitlements={entitlements}
          file={file}
          fileInputRef={fileInputRef}
          fileUrl={fileUrl}
          flashError={flashError}
          frameCount={frameCount}
          frameThumbs={frameThumbs}
          framesLength={frames.length}
          loading={loading}
          onCancelAnalysis={() => analysisControllerRef.current?.abort()}
          onAnalyze={handleAnalyze}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onFileSelected={requestFile}
          onFrameCountChange={updateFrameCount}
          onRemoveFile={handleRemoveFile}
          stage={stage}
          usageRemaining={usageRemaining}
          userPlan={userPlan}
          validationError={validationError}
        />

        <div className={styles.rightPanel} id="right-panel">
          <div
            className={`${styles.topProgress} ${
              stage === "analyzing" ? styles.topProgressVisible : ""
            }`}
          >
            <div
              className={styles.topProgressFill}
              style={{
                width:
                  stage === "done"
                    ? "100%"
                    : stage === "analyzing"
                      ? `${progressWidth}%`
                      : "0%",
              }}
            />
          </div>

          {!result ? (
            <ProcessCanvas
              activeStep={activeStep}
              canRetry={frames.length > 0 && !loading && stage !== "extracting"}
              error={error}
              frameThumbs={frameThumbs}
              onRetry={handleAnalyze}
              progressWidth={progressWidth}
              scannerIndex={scannerIndex}
              stage={processStage}
              statusMessage={liveStatusMessage}
              steps={stepsList}
            />
          ) : (
            <div className={styles.resultStack}>
              <AnalyzeStudio
                key={result.id}
                activeTab={activeTab}
                editable={editable}
                intentColor={intentColor}
                onNewAnalysis={handleReset}
                onSpecChange={handleSpecChange}
                onTabChange={setActiveTab}
                result={result}
                saveSlot={<SaveStatePill saveState={saveState} />}
              />
            </div>
          )}

          <AppStatusBar
            error={error}
            framesLength={frames.length}
            resultIntent={result?.spec.intent ?? null}
            stage={stage}
            statusMessage={liveStatusMessage}
          />
        </div>
      </main>

      {showToast && (
        <div className={styles.toast} role="status">
          Analysis complete - code ready
        </div>
      )}

      <FreeSaveNoticeModal
        key={freeSaveModalOpen ? "free-save-open" : "free-save-closed"}
        open={freeSaveModalOpen}
        onCancel={handleFreeSaveCancel}
        onConfirm={handleFreeSaveConfirm}
      />
    </div>
  );

}

function SaveStatePill({ saveState }: { saveState: SaveState }) {
  if (saveState.status === "idle") {
    return null;
  }

  if (saveState.status === "saving") {
    return (
      <span className="inline-flex h-8 items-center rounded-md border border-hairline px-2.5 font-mono text-[11px] text-ink-3">
        Saving…
      </span>
    );
  }

  if (saveState.status === "saved") {
    return (
      <Link
        href={`/projects/${saveState.projectId}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--accent-border)] bg-[var(--accent-dim)] px-2.5 font-mono text-[11px] text-ink transition hover:border-[var(--accent)]"
      >
        <span
          className="inline-flex size-1.5 rounded-full bg-accent"
          aria-hidden="true"
        />
        Saved · Open
      </Link>
    );
  }

  return (
    <span
      title={saveState.message}
      className="inline-flex h-8 items-center rounded-md border border-[#f58f7c]/40 px-2.5 font-mono text-[11px] text-[#f58f7c]"
    >
      Not saved
    </span>
  );
}

function AnalyzeStudioLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading analysis studio"
      className="relative flex h-full min-h-0 flex-col"
    >
      <div className="flex min-h-[58px] items-center justify-between gap-3 border-b border-hairline px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-2 shrink-0 rounded-full bg-accent/50" aria-hidden="true" />
          <div className="space-y-1.5">
            <div className="h-2 w-24 rounded bg-white/[0.08]" />
            <div className="h-3 w-32 rounded bg-white/[0.06]" />
          </div>
        </div>
        <div className="h-8 w-24 rounded-md border border-hairline bg-white/[0.03]" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2">
        <div className="min-w-0 border-r border-hairline">
          <div className="flex h-10 items-center border-b border-hairline px-3">
            <div className="h-2.5 w-28 rounded bg-white/[0.07]" />
          </div>
          <div className="space-y-3 p-4">
            <div className="h-2 w-4/5 rounded bg-white/[0.06]" />
            <div className="h-2 w-3/5 rounded bg-white/[0.05]" />
            <div className="h-2 w-2/3 rounded bg-white/[0.05]" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex h-10 items-center border-b border-hairline px-3">
            <div className="h-2.5 w-24 rounded bg-white/[0.07]" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function analyzeViaApi({
  frames,
  planTier,
  signal,
}: {
  frames: string[];
  planTier: PlanTier;
  signal?: AbortSignal;
}) {
  const response = await fetch("/api/analyze", {
    body: JSON.stringify({
      frames,
      model: planTier === "free" ? "gemini-2.5-flash" : "gemini-2.5-pro",
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal,
  });
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as ApiResponse<AnalysisResult>)
    : null;

  if (!response.ok) {
    throw new Error(
      payload?.ok === false ? payload.message : "Analysis failed. Try again.",
    );
  }

  if (!payload?.ok) {
    throw new Error(payload?.message ?? "Analysis failed. Try again.");
  }

  return payload.data;
}

function isAbortError(value: unknown) {
  return value instanceof Error && value.name === "AbortError";
}

function getStoredTab(): CodeTab | null {
  const savedTab = localStorage.getItem("motioncode_tab");
  return CODE_TABS.includes(savedTab as CodeTab) ? (savedTab as CodeTab) : null;
}

function readFreeSaveAcknowledged(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return (
      localStorage.getItem(FREE_SAVE_ACK_DISMISSED_KEY) === "1" ||
      sessionStorage.getItem(FREE_SAVE_ACK_SESSION_KEY) === "1"
    );
  } catch {
    // Storage blocked (private mode); fail open so the notice still shows.
    return false;
  }
}

function formatMegabytes(bytes: number) {
  return Math.round(bytes / (1024 * 1024));
}
