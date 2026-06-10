/* eslint-disable @next/next/no-img-element -- Frame thumbnails are local blob/data URLs that next/image cannot optimize. */

import type { CSSProperties } from "react";

import type { AnalysisStage } from "./types";
import styles from "./ProcessCanvas.module.css";

type ProcessCanvasProps = {
  activeStep?: number;
  canRetry?: boolean;
  error?: string | null;
  frameThumbs?: string[];
  onRetry?: () => void;
  onUploadClick?: () => void;
  progressWidth?: number;
  scannerIndex?: number;
  stage: AnalysisStage;
  statusMessage?: string;
  steps?: string[];
};

type PhaseKey = "a11y" | "compiler" | "easing" | "frames" | "perf" | "vector";
type PhaseState = "active" | "blocked" | "done" | "pending" | "ready";
type StyleVars = CSSProperties & Record<`--${string}`, string | number>;

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

const COMPILER_LANES = ["CSS", "GSAP", "Motion", "Spring"];
const VECTOR_NODES = [
  { id: "origin", label: "0", x: 12, y: 72 },
  { id: "lift", label: "1", x: 34, y: 42 },
  { id: "settle", label: "2", x: 62, y: 24 },
  { id: "target", label: "3", x: 86, y: 48 },
];

export function ProcessCanvas({
  activeStep = 0,
  canRetry = false,
  error,
  frameThumbs = [],
  onRetry,
  onUploadClick,
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
  const conveyorItems = getConveyorItems(frameThumbs);
  const safeScannerIndex =
    conveyorItems.length === 0 ? 0 : clamp(scannerIndex, 0, conveyorItems.length - 1);
  const currentStep = steps[safeActiveStep] ?? steps[0] ?? "Waiting for input";
  const heading = getHeading(stage, frameThumbs.length);
  const message = getStatusMessage(stage, statusMessage, currentStep);
  const footerStep = getFooterStep(stage, frameThumbs.length, currentStep);
  const isProcessing = stage === "analyzing" || stage === "extracting";
  const retryEnabled = canRetry && Boolean(onRetry);
  const perfMeter = getMeterValue(stage, safeProgress, safeActiveStep, 8);
  const a11yMeter = getMeterValue(stage, safeProgress, safeActiveStep, 9);
  const currentPhase = getCurrentPhase(stage, safeActiveStep);
  const completedPhases = PHASES.filter(
    (phase) => getPhaseState(phase.key, stage, safeActiveStep, frameThumbs.length) === "done",
  ).length;

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

      <div className={styles.grid}>
        <section className={cx(styles.panel, styles.framePanel)}>
          <PanelHeader
            label={`${frameThumbs.length || conveyorItems.length} ${frameThumbs.length === 1 ? "frame" : "frames"}`}
            state={getPhaseState("frames", stage, safeActiveStep, frameThumbs.length)}
            title="Frame sampling"
          />

          <div className={styles.conveyor} data-processing={isProcessing}>
            {conveyorItems.map((thumb, index) => {
              const isScanned = index === safeScannerIndex;
              return (
                <div
                  className={cx(
                    styles.frame,
                    isScanned && styles.frameActive,
                    !thumb && styles.framePlaceholder,
                  )}
                  key={thumb ? `${thumb}-${index}` : `placeholder-${index}`}
                  style={{ "--frame-index": index } as StyleVars}
                >
                  {thumb ? (
                    <img alt={`Sampled frame ${index + 1}`} src={thumb} />
                  ) : (
                    <span aria-hidden="true" className={styles.frameGlyph}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  )}
                  {isScanned && (
                    <span
                      aria-hidden="true"
                      className={cx(styles.scanBeam, isProcessing && styles.scanBeamActive)}
                      data-testid="process-scan-beam"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.timeline} aria-hidden="true">
            {conveyorItems.map((_, index) => (
              <span
                className={index <= safeScannerIndex ? styles.timelineTickActive : undefined}
                key={`tick-${index}`}
              />
            ))}
          </div>
        </section>

        <section className={cx(styles.panel, styles.solvePanel)}>
          <PanelHeader
            label={getPhaseLabel("vector", stage, safeActiveStep)}
            state={getPhaseState("vector", stage, safeActiveStep, frameThumbs.length)}
            title="Vector solve"
          />

          <div className={styles.vectorField}>
            <span className={styles.vectorLine} />
            {VECTOR_NODES.map((node, index) => (
              <span
                aria-label={`Vector node ${node.label}`}
                className={cx(
                  styles.vectorNode,
                  index <= Math.max(0, safeActiveStep - 1) && styles.vectorNodeSolved,
                )}
                key={node.id}
                style={
                  {
                    "--node-delay": `${index * 90}ms`,
                    "--node-x": `${node.x}%`,
                    "--node-y": `${node.y}%`,
                  } as StyleVars
                }
              >
                {node.label}
              </span>
            ))}
          </div>

          <div className={styles.curveSolver}>
            <div className={styles.curveGrid} aria-hidden="true">
              <span className={styles.curveSegmentOne} />
              <span className={styles.curveSegmentTwo} />
              <span className={styles.curveSegmentThree} />
              <span className={styles.curvePointStart} />
              <span className={styles.curvePointEnd} />
            </div>
            <div className={styles.curveCopy}>
              <span>Easing curve solver</span>
              <strong>{stage === "analyzing" && safeActiveStep >= 3 ? "fitting" : "queued"}</strong>
            </div>
          </div>
        </section>

        <section className={cx(styles.panel, styles.compilerPanel)}>
          <PanelHeader
            label={getPhaseLabel("compiler", stage, safeActiveStep)}
            state={getPhaseState("compiler", stage, safeActiveStep, frameThumbs.length)}
            title="Compiler lanes"
          />

          <div className={styles.lanes}>
            {COMPILER_LANES.map((lane, index) => {
              const laneProgress = getLaneProgress(stage, safeProgress, safeActiveStep, index);
              return (
                <div className={styles.lane} key={lane}>
                  <span className={styles.laneLabel}>{lane}</span>
                  <span className={styles.laneRail}>
                    <span
                      className={styles.laneFill}
                      style={
                        {
                          "--lane-delay": `${index * 110}ms`,
                          "--lane-progress": `${laneProgress}%`,
                        } as StyleVars
                      }
                    />
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className={cx(styles.panel, styles.meterPanel)}>
          <PanelHeader
            label={getPhaseLabel("perf", stage, safeActiveStep)}
            state={getPhaseState("perf", stage, safeActiveStep, frameThumbs.length)}
            title="Perf / a11y"
          />

          <div className={styles.meters}>
            <Meter label="Perf meter" value={perfMeter} />
            <Meter label="A11y meter" value={a11yMeter} />
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.phaseList} aria-label="Processing phases">
          {PHASES.map((phase, index) => {
            const state = getPhaseState(phase.key, stage, safeActiveStep, frameThumbs.length);
            return (
              <div className={styles.phaseItem} data-state={state} key={phase.key}>
                <span className={styles.phaseOrdinal}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.phaseTitle}>{phase.shortTitle}</span>
                <span className={styles.phaseDescription}>{phase.description}</span>
                <span className={styles.phaseMeta}>{getPhaseLabel(phase.key, stage, safeActiveStep)}</span>
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
        ) : (
          <div className={styles.stepBox}>
            <span className={styles.stepLabel}>Active step</span>
            <span className={styles.stepText}>{footerStep}</span>
            {stage === "idle" && onUploadClick && (
              <button className={styles.inlineAction} onClick={onUploadClick} type="button">
                Upload animation
              </button>
            )}
          </div>
        )}
      </footer>
    </section>
  );
}

function PanelHeader({
  label,
  state,
  title,
}: {
  label: string;
  state: PhaseState;
  title: string;
}) {
  return (
    <div className={styles.panelHeader} data-state={state}>
      <h3>{title}</h3>
      <span>{label}</span>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div
      aria-label={`${label} ${Math.round(value)} percent`}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(value)}
      className={styles.meter}
      role="meter"
    >
      <div className={styles.meterCopy}>
        <span>{label}</span>
        <strong>{Math.round(value)}%</strong>
      </div>
      <span className={styles.meterTrack}>
        <span
          className={styles.meterFill}
          style={{ "--meter-value": `${clamp(value, 0, 100)}%` } as StyleVars}
        />
      </span>
    </div>
  );
}

function getConveyorItems(frameThumbs: string[]) {
  if (frameThumbs.length > 0) {
    return frameThumbs.slice(0, 12);
  }

  return Array.from<string | null>({ length: 8 }).fill(null);
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
      return "The visualizer will map frames, vectors, curves, code lanes, and audits.";
  }
}

function getFooterStep(stage: AnalysisStage, frameCount: number, step: string) {
  switch (stage) {
    case "extracting":
      return "Sampling frames from the uploaded source.";
    case "analyzing":
      return step;
    case "error":
      return "Resolve the interruption, then retry analysis.";
    case "idle":
    default:
      return frameCount > 0
        ? "Frames are ready. Run analysis when you are ready."
        : "Upload animation media to start frame sampling.";
  }
}

function getMeterValue(
  stage: AnalysisStage,
  progressWidth: number,
  activeStep: number,
  targetStep: number,
) {
  if (stage === "error") {
    return activeStep >= targetStep ? 62 : 18;
  }

  if (stage === "analyzing") {
    if (activeStep < targetStep) {
      return Math.min(48, 18 + progressWidth * 0.28);
    }

    return Math.min(96, 56 + progressWidth * 0.4);
  }

  if (stage === "extracting") {
    return 24;
  }

  return 12;
}

function getLaneProgress(
  stage: AnalysisStage,
  progressWidth: number,
  activeStep: number,
  laneIndex: number,
) {
  if (stage === "error") {
    return activeStep >= 5 + laneIndex ? 72 : 12;
  }

  if (stage !== "analyzing") {
    return stage === "extracting" ? 18 : 8;
  }

  const laneStep = 5 + laneIndex;

  if (activeStep < laneStep) {
    return Math.min(34, progressWidth * 0.28);
  }

  return Math.min(100, 54 + progressWidth * 0.46);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function cx(...classes: Array<false | string | undefined>) {
  return classes.filter(Boolean).join(" ");
}
