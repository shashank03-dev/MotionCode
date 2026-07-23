/* eslint-disable @next/next/no-img-element -- Frame thumbnails are local blob/data URLs that next/image cannot optimize. */
"use client";

import type { CSSProperties } from "react";

import { MotionParticleField } from "./MotionParticleField";
import type { AnalysisStage } from "./types";
import styles from "./ProcessCanvas.module.css";

type ProcessCanvasProps = {
  activeStep?: number;
  canRetry?: boolean;
  error?: string | null;
  frameThumbs?: string[];
  onRetry?: () => void;
  progressWidth?: number;
  scannerIndex?: number;
  stage: AnalysisStage;
  statusMessage?: string;
  steps?: string[];
};

type PhaseKey = "a11y" | "compiler" | "easing" | "frames" | "perf" | "vector";
type PhaseState = "active" | "blocked" | "done" | "pending" | "ready";
type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

// Single-word label the particle field spells for each phase — kept short so
// the swarm reads clearly. Tracks the live phase, so the word morphs in step
// with what the pipeline is actually doing.
const PHASE_WORD: Record<PhaseKey, string> = {
  a11y: "A11Y",
  compiler: "CODE",
  easing: "EASING",
  frames: "FRAMES",
  perf: "PERF",
  vector: "VECTORS",
};

const FALLBACK_STEPS = [
  "Extract frames from source media",
  "Send frames to server analysis",
  "Detect motion vectors",
  "Analyze easing curves",
  "Identify animation intent",
  "Generate CSS keyframes",
  "Generate GSAP timeline",
  "Generate Framer Motion variants",
  "Run performance audit",
  "Check accessibility compliance",
  "Compile output",
];

const PHASES: Array<{
  description: string;
  from: number;
  key: PhaseKey;
  metric: string;
  shortTitle: string;
  title: string;
  to: number;
}> = [
  {
    description: "Decode media into comparable moments.",
    from: 0,
    key: "frames",
    metric: "samples",
    shortTitle: "Frames",
    title: "Frame sampling",
    to: 1,
  },
  {
    description: "Resolve movement vectors and anchor points.",
    from: 2,
    key: "vector",
    metric: "nodes",
    shortTitle: "Vectors",
    title: "Vector solve",
    to: 2,
  },
  {
    description: "Fit timing data to a reusable curve.",
    from: 3,
    key: "easing",
    metric: "curve",
    shortTitle: "Easing",
    title: "Easing curve",
    to: 4,
  },
  {
    description: "Prepare CSS, GSAP, Motion, and Spring lanes.",
    from: 5,
    key: "compiler",
    metric: "lanes",
    shortTitle: "Code lanes",
    title: "Compiler lanes",
    to: 7,
  },
  {
    description: "Check transform, opacity, and paint cost.",
    from: 8,
    key: "perf",
    metric: "budget",
    shortTitle: "Perf audit",
    title: "Perf meter",
    to: 8,
  },
  {
    description: "Verify reduced motion and timing tolerance.",
    from: 9,
    key: "a11y",
    metric: "guard",
    shortTitle: "A11y audit",
    title: "A11y meter",
    to: 9,
  },
];

export function ProcessCanvas({
  activeStep = 0,
  canRetry = false,
  error,
  frameThumbs = [],
  onRetry,
  progressWidth = 0,
  scannerIndex = 0,
  stage,
  statusMessage,
  steps = FALLBACK_STEPS,
}: ProcessCanvasProps) {
  if (stage === "done") {
    return null;
  }

  const safeActiveStep = clamp(activeStep, 0, Math.max(steps.length - 1, 0));
  const safeProgress = clamp(progressWidth, 0, 100);
  const visibleFrames = frameThumbs.slice(0, 12);
  const safeScannerIndex =
    visibleFrames.length === 0 ? 0 : clamp(scannerIndex, 0, visibleFrames.length - 1);
  const currentStep = steps[safeActiveStep] ?? steps[0] ?? "Waiting for input";
  const heading = getHeading(stage, frameThumbs.length);
  const message = getStatusMessage(stage, statusMessage, currentStep);
  const isProcessing = stage === "analyzing" || stage === "extracting";
  const retryEnabled = canRetry && Boolean(onRetry);
  const currentPhase = getCurrentPhase(stage, safeActiveStep);
  const completedPhases = PHASES.filter(
    (phase) => getPhaseState(phase.key, stage, safeActiveStep, frameThumbs.length) === "done",
  ).length;

  // The particle field reads progress directly: idle rests as a scatter cloud,
  // extraction nudges it toward the filmstrip, analysis drives the full morph.
  const fieldProgress =
    stage === "idle"
      ? 0
      : stage === "extracting"
        ? Math.max(6, safeProgress * 0.2)
        : safeProgress;

  // The word the particle field spells right now: the active phase while the
  // pipeline runs, nothing when idle/errored so the cloud rests as a formation.
  const fieldLabel = isProcessing ? PHASE_WORD[currentPhase.key] : null;

  return (
    <section
      aria-live={stage === "error" ? "assertive" : "polite"}
      className={styles.canvas}
      data-stage={stage}
      data-testid="process-canvas"
    >
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <span className={styles.kicker}>{getStageLabel(stage)}</span>
          <h2 className={styles.title}>{heading}</h2>
          <p className={styles.message}>{message}</p>
          <div className={styles.headerMeta} aria-label="Current processing context">
            <span>{currentPhase.title}</span>
            <span>{currentPhase.description}</span>
          </div>
        </div>

        <div
          aria-label={`Process progress ${Math.round(safeProgress)} percent`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(safeProgress)}
          className={styles.progressBlock}
          role="progressbar"
        >
          <div className={styles.progressTopline}>
            <span className={styles.progressValue}>{Math.round(safeProgress)}%</span>
            <span className={styles.progressPhase}>
              {completedPhases}/{PHASES.length} phases
            </span>
          </div>
          <span className={styles.progressTrack}>
            <span
              className={styles.progressFill}
              style={{ "--progress": `${safeProgress}%` } as StyleVars}
            />
          </span>
          <span className={styles.progressCaption}>{getProgressCaption(stage, safeActiveStep)}</span>
        </div>
      </header>

      {/* The signature surface: a single particle cloud that reorganizes itself
          through the pipeline — scatter → frames → vectors → easing curve →
          code → compiled — instead of a grid of decorative status blocks. */}
      <div
        className={styles.stage}
        data-processing={isProcessing}
        data-testid="process-field"
      >
        <MotionParticleField
          className={styles.field}
          progress={fieldProgress}
          label={fieldLabel}
        />

        <div className={styles.stageOverlay}>
          <span className={styles.stageFormation}>{getFormationLabel(fieldProgress)}</span>
          <span className={styles.stageReadout}>
            {currentPhase.metric} · {getPhaseLabel(currentPhase.key, stage, safeActiveStep)}
          </span>
        </div>

        {visibleFrames.length > 0 && (
          <div className={styles.frameRail} aria-label="Sampled frames">
            {visibleFrames.map((thumb, index) => (
              <span
                className={cx(
                  styles.frameChip,
                  index === safeScannerIndex && isProcessing && styles.frameChipActive,
                )}
                key={`${thumb}-${index}`}
              >
                <img alt={`Sampled frame ${index + 1}`} src={thumb} loading="lazy" decoding="async" />
              </span>
            ))}
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <div className={styles.phaseRail} aria-label="Processing phases">
          {PHASES.map((phase, index) => {
            const state = getPhaseState(phase.key, stage, safeActiveStep, frameThumbs.length);
            return (
              <div className={styles.phaseRailItem} data-state={state} key={phase.key}>
                <span className={styles.phaseRailOrdinal}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.phaseRailTitle}>{phase.shortTitle}</span>
              </div>
            );
          })}
        </div>

        {stage === "error" ? (
          <div className={styles.errorBox}>
            <div>
              <strong>Processing failed</strong>
              <span>{error || "Analysis failed. Try again."}</span>
            </div>
            <div className={styles.actions}>
              <a className={styles.secondaryAction} href="/pricing">
                View pricing
              </a>
              <button
                className={styles.primaryAction}
                disabled={!retryEnabled}
                onClick={onRetry}
                type="button"
              >
                Retry analysis
              </button>
            </div>
          </div>
        ) : null}
      </footer>
    </section>
  );
}

/** Names the formation the particle field is currently resolving into. */
function getFormationLabel(progress: number) {
  const m = (clamp(progress, 0, 100) / 100) * 5;
  if (m < 0.6) return "source · unstructured";
  if (m < 1.6) return "frames · sampling";
  if (m < 2.6) return "vectors · resolving";
  if (m < 3.6) return "easing · fitting curve";
  if (m < 4.6) return "code · emitting";
  return "compiled · stable";
}

function getPhaseState(
  key: PhaseKey,
  stage: AnalysisStage,
  activeStep: number,
  frameCount: number,
): PhaseState {
  const phase = PHASES.find((item) => item.key === key);

  if (!phase) {
    return "pending";
  }

  if (stage === "error") {
    if (activeStep > phase.to) {
      return "done";
    }

    if (activeStep >= phase.from) {
      return "blocked";
    }

    return "pending";
  }

  if (stage === "extracting") {
    return key === "frames" ? "active" : "pending";
  }

  if (stage === "idle") {
    return key === "frames" && frameCount > 0 ? "ready" : "pending";
  }

  if (activeStep > phase.to) {
    return "done";
  }

  if (activeStep >= phase.from) {
    return "active";
  }

  return "pending";
}

function getPhaseLabel(key: PhaseKey, stage: AnalysisStage, activeStep: number) {
  const state = getPhaseState(key, stage, activeStep, 0);

  if (state === "blocked") {
    return "needs review";
  }

  if (state === "done") {
    return "complete";
  }

  if (state === "active") {
    return "running";
  }

  if (state === "ready") {
    return "ready";
  }

  return "queued";
}

function getCurrentPhase(stage: AnalysisStage, activeStep: number) {
  if (stage === "idle") {
    return PHASES[0];
  }

  if (stage === "extracting") {
    return PHASES[0];
  }

  if (stage === "error") {
    return PHASES.find((phase) => activeStep >= phase.from && activeStep <= phase.to) ?? PHASES[0];
  }

  return (
    PHASES.find((phase) => activeStep >= phase.from && activeStep <= phase.to) ??
    PHASES[PHASES.length - 1]
  );
}

function getProgressCaption(stage: AnalysisStage, activeStep: number) {
  switch (stage) {
    case "extracting":
      return "Frame buffer warming";
    case "analyzing":
      return `Step ${activeStep + 1} in progress`;
    case "error":
      return "Interrupted";
    case "idle":
    default:
      return "Standing by";
  }
}

function getHeading(stage: AnalysisStage, frameCount: number) {
  switch (stage) {
    case "extracting":
      return "Sampling motion frames";
    case "analyzing":
      return "Building animation code";
    case "error":
      return "Processing needs attention";
    case "idle":
    default:
      return frameCount > 0 ? "Ready to analyze motion" : "Upload motion to begin";
  }
}

function getStageLabel(stage: AnalysisStage) {
  switch (stage) {
    case "extracting":
      return "Extracting";
    case "analyzing":
      return "Analyzing";
    case "error":
      return "Error";
    case "idle":
    default:
      return "Idle";
  }
}

function getStatusMessage(stage: AnalysisStage, statusMessage: string | undefined, step: string) {
  if (statusMessage) {
    return statusMessage;
  }

  switch (stage) {
    case "extracting":
      return "Frame sampling is preparing thumbnails for analysis.";
    case "analyzing":
      return step;
    case "error":
      return "Review the error and retry when ready.";
    case "idle":
    default:
      return "The field resolves your motion into frames, vectors, an easing curve, and code.";
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function cx(...classes: Array<false | string | undefined>) {
  return classes.filter(Boolean).join(" ");
}
