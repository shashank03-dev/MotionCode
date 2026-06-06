"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent, MouseEvent } from "react";
import Link from "next/link";
import type { AnimationAnalysisResult } from "@/lib/animationResult";
import { extractFrames, validateFrameRequest } from "@/lib/extractFrames";
import type { CodeTab } from "@/lib/generatedCode";
import { canUseForFree, FREE_LIMIT, incrementUsage } from "@/lib/rateLimit";
import { AnalysisPanel } from "./AnalysisPanel";
import { UploadPanel } from "./UploadPanel";

export type AppStage = "idle" | "extracting" | "analyzing" | "done" | "error";
export type UserPlan = "free" | "pro";

const CODE_TABS: CodeTab[] = ["CSS", "GSAP", "Framer Motion", "React Spring"];

function getSavedCodeTab(): CodeTab {
  if (typeof window === "undefined") return "CSS";

  const savedTab = window.localStorage.getItem("motioncode_tab");
  return CODE_TABS.includes(savedTab as CodeTab) ? (savedTab as CodeTab) : "CSS";
}

async function analyzeFrames(frames: string[]): Promise<AnimationAnalysisResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ frames, frameCount: frames.length }),
  });

  const data = await response.json() as AnimationAnalysisResult & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Analysis failed");
  }

  return data;
}

export function AppShell() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(8);
  const [frames, setFrames] = useState<string[]>([]);
  const [frameThumbs, setFrameThumbs] = useState<string[]>([]);
  // Free mode remains the only active plan until account-backed plan state ships.
  const [userPlan] = useState<UserPlan>("free");

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [stage, setStage] = useState<AppStage>("idle");
  const [result, setResult] = useState<AnimationAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<CodeTab>(() => getSavedCodeTab());
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [flashError, setFlashError] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [activeStep, setActiveStep] = useState(0);
  const [scannerIndex, setScannerIndex] = useState(0);
  const [statusBarMsgIndex, setStatusBarMsgIndex] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const extractionSequenceRef = useRef(0);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scannerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileWithCount = useCallback(async (selectedFile: File, count: number) => {
    const extractionSequence = extractionSequenceRef.current + 1;
    extractionSequenceRef.current = extractionSequence;
    const validation = validateFrameRequest(selectedFile, count);

    if (!validation.ok) {
      setFile(null);
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
        setFileUrl(null);
      }
      setFrames([]);
      setFrameThumbs([]);
      setResult(null);
      setError(null);
      setProgressWidth(0);
      setFlashError(true);
      setValidationError(validation.error);
      setStage("idle");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setTimeout(() => {
        setFlashError(false);
      }, 1500);
      return;
    }
    setValidationError(null);

    setFile(selectedFile);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    const url = URL.createObjectURL(selectedFile);
    setFileUrl(url);
    setStage("extracting");
    setError(null);
    setResult(null);
    setFrames([]);
    setFrameThumbs([]);
    setProgressWidth(0);

    try {
      const extracted = await extractFrames(selectedFile, validation.normalizedCount);
      if (extractionSequence !== extractionSequenceRef.current) return;

      setFrames(extracted);
      setFrameThumbs(extracted.map((frame) => `data:image/jpeg;base64,${frame}`));
      setStage("idle");
    } catch (err: unknown) {
      if (extractionSequence !== extractionSequenceRef.current) return;

      setStage("error");
      setError(err instanceof Error ? err.message : "Failed to extract frames.");
    }
  }, [fileUrl]);

  const handleFile = useCallback((selectedFile: File) => {
    void handleFileWithCount(selectedFile, frameCount);
  }, [frameCount, handleFileWithCount]);

  const handleRemoveFile = useCallback((event?: MouseEvent<HTMLElement>) => {
    if (event) event.stopPropagation();
    extractionSequenceRef.current += 1;
    setFile(null);
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
      setFileUrl(null);
    }
    setFrames([]);
    setFrameThumbs([]);
    setStage("idle");
    setResult(null);
    setError(null);
    setValidationError(null);
    setProgressWidth(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [fileUrl]);

  const handleReset = useCallback(() => {
    handleRemoveFile();
    setStage("idle");
    setResult(null);
    setError(null);
    setValidationError(null);
    setFrames([]);
    setFrameThumbs([]);
    setProgressWidth(0);
  }, [handleRemoveFile]);

  const updateFrameCount = useCallback((count: number) => {
    setFrameCount(count);
    if (file) {
      void handleFileWithCount(file, count);
    }
  }, [file, handleFileWithCount]);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  }, []);

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFile(event.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleAnalyze = useCallback(async () => {
    if (!frames.length || loading) return;

    if (userPlan === "free" && !canUseForFree()) {
      setError(`Daily limit reached (${FREE_LIMIT}/day). Try again tomorrow.`);
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    setStatusMessage("Analyzing motion...");
    setActiveStep(0);
    setScannerIndex(0);
    setStatusBarMsgIndex(0);
    setProgressWidth(0);
    setStage("analyzing");

    try {
      const parsed = await analyzeFrames(frames);

      if (userPlan === "free") {
        incrementUsage();
      }

      setResult(parsed);
      setActiveTab(getSavedCodeTab());
      setStage("done");
      setShowToast(true);
    } catch (err: unknown) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed. Try again.");
      setStage("error");
    }

    setLoading(false);
  }, [frames, loading, userPlan]);

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
        setActiveTab(CODE_TABS[parseInt(event.key) - 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [frames.length, handleAnalyze, loading, result, stage]);

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem("motioncode_tab", activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (stage === "done" && result) {
      document.title = `${result.intent} · ${result.element} — MotionCode`;
    } else {
      document.title = "MotionCode — Turn Animations Into Production Code";
    }
  }, [stage, result]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    if (stage === "analyzing") {
      const runSteps = (currentStep: number) => {
        setActiveStep(currentStep);
        if (currentStep < 10) {
          stepTimerRef.current = setTimeout(() => runSteps(currentStep + 1), 600);
        }
      };

      const progressTimer = setTimeout(() => setProgressWidth(85), 100);

      stepTimerRef.current = setTimeout(() => runSteps(1), 600);

      scannerTimerRef.current = setInterval(() => {
        setScannerIndex((prev) => (prev + 1) % (frames.length || 1));
      }, 300);

      statusTimerRef.current = setInterval(() => {
        setStatusBarMsgIndex((prev) => (prev + 1) % 4);
      }, 3000);
      return () => {
        clearTimeout(progressTimer);
        if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
        if (scannerTimerRef.current) clearInterval(scannerTimerRef.current);
        if (statusTimerRef.current) clearInterval(statusTimerRef.current);
      };
    }

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
      if (scannerTimerRef.current) clearInterval(scannerTimerRef.current);
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    };
  }, [stage, frames.length]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh", width: "100vw",
      overflow: "hidden", backgroundColor: "#080808", color: "#e2e8f0",
      fontFamily: "Inter, sans-serif"
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
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
      ` }} />

      <nav id="navbar" style={{
        height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", borderBottom: "1px solid #1a1a1a", backgroundColor: "#080808",
        flexShrink: 0
      }}>
        <Link href="/" style={{ fontFamily: "Space Mono, monospace", fontSize: 14, color: "#e2e8f0", textDecoration: "none", fontWeight: "bold" }}>⟨/⟩ MotionCode</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {userPlan === "free" ? (
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, border: "1px solid #3a3a4a", padding: "2px 8px", color: "#3a3a4a", letterSpacing: 2 }}>FREE</div>
          ) : (
            <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, border: "1px solid #00ff88", padding: "2px 8px", color: "#00ff88", letterSpacing: 2 }}>PRO ⚡</div>
          )}
          <Link href="/" style={{ fontFamily: "Space Mono, monospace", fontSize: 13, color: "#3a3a4a", textDecoration: "none" }}>← Back to home</Link>
        </div>
      </nav>

      <main id="main-area" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <UploadPanel
          file={file}
          fileUrl={fileUrl}
          frameCount={frameCount}
          frames={frames}
          frameThumbs={frameThumbs}
          userPlan={userPlan}
          loading={loading}
          stage={stage}
          validationError={validationError}
          flashError={flashError}
          dragActive={dragActive}
          fileInputRef={fileInputRef}
          onFile={handleFile}
          onRemoveFile={handleRemoveFile}
          onFrameCountChange={updateFrameCount}
          onAnalyze={() => void handleAnalyze()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />

        <AnalysisPanel
          stage={stage}
          result={result}
          frames={frames}
          frameThumbs={frameThumbs}
          activeTab={activeTab}
          activeStep={activeStep}
          scannerIndex={scannerIndex}
          statusBarMsgIndex={statusBarMsgIndex}
          statusMessage={statusMessage}
          progressWidth={progressWidth}
          error={error}
          onTabChange={setActiveTab}
          onReset={handleReset}
        />
      </main>

      {showToast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          background: "#0f0f0f", border: "1px solid #00ff88",
          padding: "12px 20px", color: "#00ff88", fontFamily: "Space Mono, monospace", fontSize: 12,
          boxShadow: "0 8px 32px rgba(0,255,136,0.15)",
          animation: "fadeSlideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards"
        }}>
          ✓ Analysis complete — code ready
        </div>
      )}
    </div>
  );
}
