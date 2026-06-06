"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";

import { AnalysisStatus } from "@/components/app/AnalysisStatus";
import { CodeOutput } from "@/components/app/CodeOutput";
import { EmptyState } from "@/components/app/EmptyState";
import { MotionSpecPanel } from "@/components/app/MotionSpecPanel";
import { Scorecard } from "@/components/app/Scorecard";
import { UploadPanel } from "@/components/app/UploadPanel";
import type { ApiResponse } from "@/lib/contracts/errors";
import type { AnalysisResult } from "@/lib/contracts/motion";
import { PLAN_ENTITLEMENTS, type PlanTier } from "@/lib/contracts/plans";
import { extractFrames, isSupportedMediaFile } from "@/lib/extractFrames";
import {
  CODE_TABS,
  type CodeTab,
  getCodeContent,
  getDownloadFilename,
} from "@/lib/generatedCode";
import type { MotionSpecEditableField } from "@/lib/motionSpecEditor";
import { updateAnalysisResultSpec } from "@/lib/motionSpecEditor";
import { canUseForFree, incrementUsage, usagesLeft } from "@/lib/rateLimit";

import type { AnalysisStage, ClientAnalysisIds, ScoreKey } from "./types";

const DEFAULT_ENTITLEMENTS = PLAN_ENTITLEMENTS.free;
const DEFAULT_FRAME_COUNT = DEFAULT_ENTITLEMENTS.maxFramesPerAnalysis;

const INTENT_COLORS: Record<string, string> = {
  entrance: "#3b82f6",
  exit: "#ef4444",
  hover: "#f59e0b",
  loading: "#8b5cf6",
  loop: "#10b981",
  morph: "#00ff88",
};

const STATUS_MESSAGES = [
  "Analyzing motion patterns...",
  "Reading easing curves...",
  "Detecting transform paths...",
  "Almost there...",
];

export function AppShell() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileUrlRef = useRef<string | null>(null);
  const analysisIdsRef = useRef<ClientAnalysisIds>(createClientAnalysisIds());
  const stepTimerRef = useRef<number | null>(null);
  const scannerTimerRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);

  const userPlan: PlanTier = DEFAULT_ENTITLEMENTS.tier;
  const entitlements = PLAN_ENTITLEMENTS[userPlan];

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
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [flashError, setFlashError] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [hoveredScore, setHoveredScore] = useState<ScoreKey | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [scannerIndex, setScannerIndex] = useState(0);
  const [statusBarMsgIndex, setStatusBarMsgIndex] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);

  const canUseFree = userPlan !== "free" || canUseForFree();
  const usageRemaining = usagesLeft();

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
      clearTimeout(stepTimerRef.current);
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
      setFile(selectedFile);
      analysisIdsRef.current = createClientAnalysisIds();
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
        });
        setFrames(extracted);
        setFrameThumbs(extracted.map((frame) => `data:image/jpeg;base64,${frame}`));
        setStage("idle");
      } catch (caught) {
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

  const handleRemoveFile = useCallback(
    (event?: MouseEvent) => {
      event?.stopPropagation();
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
  }, [handleRemoveFile]);

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

    if (userPlan === "free" && !canUseForFree()) {
      setError(
        `Daily limit reached (${entitlements.dailyAnalyses}/day). Upgrade to Pro for more analyses.`,
      );
      return;
    }

    setLoading(true);
    setStage("analyzing");
    setResult(null);
    setError(null);
    setStatusMessage("Analyzing with server model...");

    try {
      const analyzed = await analyzeViaApi({
        frames,
        ids: analysisIdsRef.current,
        planTier: userPlan,
      });

      if (userPlan === "free") {
        incrementUsage();
      }

      setResult(analyzed);
      setActiveTab(getStoredTab() ?? "CSS");
      setStage("done");
      setShowToast(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed. Try again.");
      setStage("error");
    } finally {
      setLoading(false);
    }
  }, [entitlements.dailyAnalyses, frames, loading, userPlan]);

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
        handleFile(selectedFile);
      }
    },
    [handleFile],
  );

  const handleCopy = useCallback(() => {
    const code = getCodeContent(result, activeTab);
    void navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [activeTab, result]);

  const handleDownload = useCallback(() => {
    const code = getCodeContent(result, activeTab);
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = getDownloadFilename(activeTab);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [activeTab, result]);

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
    let progressTimer: number | null = null;

    if (stage === "analyzing") {
      const runSteps = (currentStep: number) => {
        setActiveStep(currentStep);
        if (currentStep < stepsList.length - 1) {
          stepTimerRef.current = window.setTimeout(
            () => runSteps(currentStep + 1),
            600,
          );
        }
      };

      resetTimer = window.setTimeout(() => {
        setActiveStep(0);
        setScannerIndex(0);
        setStatusBarMsgIndex(0);
        setProgressWidth(0);
      }, 0);
      progressTimer = window.setTimeout(() => setProgressWidth(85), 100);
      stepTimerRef.current = window.setTimeout(() => runSteps(1), 600);
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
      if (progressTimer !== null) {
        window.clearTimeout(progressTimer);
      }
      clearAnimationTimers();
    };
  }, [clearAnimationTimers, frames.length, stage, stepsList.length]);

  const intentColor = result
    ? INTENT_COLORS[result.spec.intent.toLowerCase()] || "#00ff88"
    : "#00ff88";

  return (
    <div
      id="app-root"
      style={{
        backgroundColor: "#080808",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, sans-serif",
        height: "100vh",
        overflow: "hidden",
        width: "100vw",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
        @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeOut { to { opacity: 0; transform: translateY(8px) } }
        .copy-btn:hover {
          box-shadow: 0 0 12px #00ff8860;
          border-color: #00ff88 !important;
          color: #00ff88 !important;
        }
        @media (max-width: 768px) {
          #main-area { flex-direction: column !important; }
          #left-panel { width: 100% !important; height: auto !important; min-height: 0 !important; }
          #right-panel { width: 100% !important; flex: 1 !important; min-height: 60vh !important; }
          #video-preview { max-height: 140px !important; }
          #frame-strip-container { overflow-x: scroll !important; flex-wrap: nowrap !important; }
          #navbar { padding: 0 16px !important; }
        }
      `,
        }}
      />

      <nav
        id="navbar"
        style={{
          alignItems: "center",
          backgroundColor: "#080808",
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          flexShrink: 0,
          height: 56,
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#e2e8f0",
            fontFamily: "Space Mono, monospace",
            fontSize: 14,
            fontWeight: "bold",
            textDecoration: "none",
          }}
        >
          &lt;/&gt; MotionCode
        </Link>
        <div style={{ alignItems: "center", display: "flex", gap: 16 }}>
          <div
            style={{
              border: `1px solid ${userPlan === "free" ? "#3a3a4a" : "#00ff88"}`,
              color: userPlan === "free" ? "#3a3a4a" : "#00ff88",
              fontFamily: "Space Mono, monospace",
              fontSize: 9,
              letterSpacing: 2,
              padding: "2px 8px",
            }}
          >
            {userPlan.toUpperCase()}
          </div>
          <Link
            href="/"
            style={{
              color: "#3a3a4a",
              fontFamily: "Space Mono, monospace",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            Back to home
          </Link>
        </div>
      </nav>

      <h1 className="sr-only">MotionCode animation converter</h1>

      <main id="main-area" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
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
          onAnalyze={handleAnalyze}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onFileSelected={handleFile}
          onFrameCountChange={updateFrameCount}
          onRemoveFile={handleRemoveFile}
          stage={stage}
          usageRemaining={usageRemaining}
          userPlan={userPlan}
          validationError={validationError}
        />

        <div
          id="right-panel"
          style={{
            backgroundColor: "#080808",
            display: "flex",
            flex: 1,
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              backgroundColor: "#1a1a1a",
              height: 2,
              left: 0,
              opacity: stage === "done" ? 0 : stage === "analyzing" ? 1 : 0,
              pointerEvents: "none",
              position: "absolute",
              right: 0,
              top: 0,
              transition: stage === "done" ? "opacity 0.4s ease 0.4s" : "none",
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: "linear-gradient(90deg, #00ff88, #00cc6e)",
                height: "100%",
                transition:
                  stage === "done"
                    ? "width 0.1s ease-out"
                    : "width 20s cubic-bezier(0.1, 0, 0.3, 1)",
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
            stage === "analyzing" ? (
              <AnalysisStatus
                activeStep={activeStep}
                frameThumbs={frameThumbs}
                scannerIndex={scannerIndex}
                steps={stepsList}
              />
            ) : (
              <EmptyState />
            )
          ) : (
            <div
              style={{
                display: "flex",
                flex: 1,
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <MotionSpecPanel
                intentColor={intentColor}
                onReset={handleReset}
                onSpecChange={handleSpecChange}
                result={result}
              />
              <CodeOutput
                activeTab={activeTab}
                copied={copied}
                onCopy={handleCopy}
                onDownload={handleDownload}
                onTabChange={setActiveTab}
                result={result}
              />
              <Scorecard
                hoveredScore={hoveredScore}
                onHoveredScoreChange={setHoveredScore}
                spec={result.spec}
              />
            </div>
          )}

          <div
            style={{
              alignItems: "center",
              backgroundColor: "#080808",
              borderTop: "1px solid #1a1a1a",
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 24px",
            }}
          >
            <div
              style={{
                alignItems: "center",
                color: "#3a3a4a",
                display: "flex",
                fontFamily: "Space Mono, monospace",
                fontSize: 11,
                gap: 10,
              }}
            >
              {stage === "idle" && (
                <span>Cmd+Enter analyze / 1-4 switch tabs / Cmd+K upload</span>
              )}
              {stage === "extracting" && (
                <>
                  <StatusDot />
                  <span>Extracting frames...</span>
                </>
              )}
              {stage === "analyzing" && (
                <>
                  <StatusDot />
                  <span>{statusMessage || STATUS_MESSAGES[statusBarMsgIndex]}</span>
                </>
              )}
              {stage === "done" && result && (
                <span style={{ color: "#00ff88" }}>
                  Analysis complete / {frames.length} frames / {result.spec.intent} detected
                </span>
              )}
              {stage === "error" && <span style={{ color: "#ef4444" }}>{error}</span>}
            </div>
            <div
              style={{
                color: "#1a1a1a",
                fontFamily: "Space Mono, monospace",
                fontSize: 10,
              }}
            />
          </div>
        </div>
      </main>

      {showToast && (
        <div
          style={{
            animation: "fadeSlideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards",
            background: "#0f0f0f",
            border: "1px solid #00ff88",
            bottom: 24,
            boxShadow: "0 8px 32px rgba(0,255,136,0.15)",
            color: "#00ff88",
            fontFamily: "Space Mono, monospace",
            fontSize: 12,
            padding: "12px 20px",
            position: "fixed",
            right: 24,
            zIndex: 1000,
          }}
        >
          Analysis complete - code ready
        </div>
      )}
    </div>
  );

}

function StatusDot() {
  return (
    <div
      style={{
        animation: "blink 0.8s infinite",
        backgroundColor: "#00ff88",
        borderRadius: "50%",
        height: 6,
        width: 6,
      }}
    />
  );
}

async function analyzeViaApi({
  frames,
  ids,
  planTier,
}: {
  frames: string[];
  ids: ClientAnalysisIds;
  planTier: PlanTier;
}) {
  const response = await fetch("/api/analyze", {
    body: JSON.stringify({
      ...ids,
      frames,
      model: planTier === "free" ? "gemini-2.5-flash" : "gemini-2.5-pro",
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
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

function getStoredTab(): CodeTab | null {
  const savedTab = localStorage.getItem("motioncode_tab");
  return CODE_TABS.includes(savedTab as CodeTab) ? (savedTab as CodeTab) : null;
}

function createClientAnalysisIds(): ClientAnalysisIds {
  return {
    assetId: createUuid(),
    projectId: createUuid(),
    versionId: createUuid(),
  };
}

function createUuid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) =>
    (
      Number(char) ^
      (Math.random() * 16) >> (Number(char) / 4)
    ).toString(16),
  );
}

function formatMegabytes(bytes: number) {
  return Math.round(bytes / (1024 * 1024));
}
