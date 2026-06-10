"use client";

import React from "react";
import {
  Braces,
  CheckCircle2,
  Code2,
  FileVideo,
  Gauge,
  Layers3,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
  Waypoints,
} from "lucide-react";
import { motion, type MotionValue, useTransform } from "framer-motion";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const bridgeStages = [
  {
    label: "Upload",
    title: "Drop in the reference",
    body: "MotionCode keeps the clip, timing, and source format visible while analysis starts.",
    detail: "MP4, WebM, GIF, Lottie",
    icon: Upload,
  },
  {
    label: "Sample",
    title: "Extract the frame strip",
    body: "Key moments become inspectable samples so designers and engineers can agree on what moved.",
    detail: "8-24 sampled frames",
    icon: Layers3,
  },
  {
    label: "Map",
    title: "Resolve paths and easing",
    body: "Transform paths, easing curves, duration, and intent are mapped into a readable motion spec.",
    detail: "Bezier paths + timing",
    icon: Waypoints,
  },
  {
    label: "Export",
    title: "Ship code with QA notes",
    body: "CSS, GSAP, and Motion variants arrive with reduced-motion and composite-safety checks.",
    detail: "Exports + review checklist",
    icon: ShieldCheck,
  },
];

const frameSamples = ["00", "04", "08", "12", "16", "20", "24", "28"];

const codeLines = [
  ".motion-card {",
  "  transform: translate3d(var(--x), 0, 0);",
  "  transition: transform 640ms cubic-bezier(.2,.9,.2,1);",
  "}",
];

const exportTabs = ["CSS", "GSAP", "Motion"];

const remapTokens = [
  { label: "duration", value: "640ms" },
  { label: "ease", value: "out-cubic" },
  { label: "x", value: "mapped" },
  { label: "a11y", value: "safe" },
];

function StageItem({
  stage,
  index,
  progress,
  prefersReducedMotion,
}: {
  stage: (typeof bridgeStages)[number];
  index: number;
  progress: MotionValue<number>;
  prefersReducedMotion: boolean;
}) {
  const Icon = stage.icon;
  const start = index / bridgeStages.length;
  const center = (index + 0.5) / bridgeStages.length;
  const end = (index + 1) / bridgeStages.length;
  const opacity = useTransform(
    progress,
    [Math.max(0, start - 0.1), center, Math.min(1, end + 0.08)],
    prefersReducedMotion ? [1, 1, 1] : [0.46, 1, 0.58],
  );
  const x = useTransform(
    progress,
    [start, center, end],
    prefersReducedMotion ? [0, 0, 0] : [-16, 0, 10],
  );

  return (
    <motion.article
      style={{ opacity, x }}
      role="listitem"
      className="motioncode-bridge-stage"
    >
      <span className="motioncode-bridge-stage-icon" aria-hidden="true">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="motioncode-bridge-stage-copy">
        <strong>{stage.label}</strong>
        <small>{stage.detail}</small>
      </span>
    </motion.article>
  );
}

function StageList({
  progress,
  prefersReducedMotion,
}: {
  progress: MotionValue<number>;
  prefersReducedMotion: boolean;
}) {
  return (
    <div
      className="motioncode-bridge-stage-list"
      role="list"
      aria-label="MotionCode conversion stages"
    >
      {bridgeStages.map((stage, index) => (
        <StageItem
          key={stage.label}
          stage={stage}
          index={index}
          progress={progress}
          prefersReducedMotion={prefersReducedMotion}
        />
      ))}
    </div>
  );
}

function SourceClip({
  progress,
  prefersReducedMotion,
}: {
  progress: MotionValue<number>;
  prefersReducedMotion: boolean;
}) {
  const y = useTransform(
    progress,
    [0, 0.2, 0.42],
    prefersReducedMotion ? [0, 0, 0] : [22, 0, -10],
  );
  const opacity = useTransform(
    progress,
    [0, 0.08, 0.5],
    prefersReducedMotion ? [1, 1, 1] : [0.7, 1, 0.72],
  );

  return (
    <motion.div style={{ y, opacity }} className="motioncode-bridge-source-panel">
      <div className="motioncode-bridge-panel-top">
        <FileVideo size={16} strokeWidth={1.8} />
        <span>reference clip</span>
      </div>
      <div className="motioncode-bridge-source-stage" aria-hidden="true">
        <span className="motioncode-bridge-source-object" />
        <span className="motioncode-bridge-source-ghost motioncode-bridge-source-ghost-a" />
        <span className="motioncode-bridge-source-ghost motioncode-bridge-source-ghost-b" />
      </div>
      <div className="motioncode-bridge-frame-strip" aria-label="Sampled frame strip">
        {frameSamples.map((frame, index) => (
          <span key={frame} style={{ "--frame-index": index } as React.CSSProperties}>
            {frame}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function MotionMap({
  progress,
  prefersReducedMotion,
}: {
  progress: MotionValue<number>;
  prefersReducedMotion: boolean;
}) {
  const pathScale = useTransform(
    progress,
    [0.22, 0.46],
    prefersReducedMotion ? [1, 1] : [0.18, 1],
  );
  const mapY = useTransform(
    progress,
    [0.22, 0.46, 0.7],
    prefersReducedMotion ? [0, 0, 0] : [24, 0, -8],
  );

  return (
    <motion.div style={{ y: mapY }} className="motioncode-bridge-map-panel">
      <div className="motioncode-bridge-panel-top">
        <ScanLine size={16} strokeWidth={1.8} />
        <span>motion map</span>
      </div>
      <div className="motioncode-bridge-map-field" aria-hidden="true">
        <motion.span
          className="motioncode-bridge-map-path"
          style={{ scaleX: pathScale }}
        />
        <span className="motioncode-bridge-map-node motioncode-bridge-map-node-a" />
        <span className="motioncode-bridge-map-node motioncode-bridge-map-node-b" />
        <span className="motioncode-bridge-map-node motioncode-bridge-map-node-c" />
        <span className="motioncode-bridge-map-node motioncode-bridge-map-node-d" />
      </div>
      <div className="motioncode-bridge-map-readout">
        <span>duration 640ms</span>
        <span>ease out-cubic</span>
        <span>translate x</span>
      </div>
    </motion.div>
  );
}

function ExportPanel({
  progress,
  prefersReducedMotion,
  tokenOpacity,
  tokenY,
}: {
  progress: MotionValue<number>;
  prefersReducedMotion: boolean;
  tokenOpacity: MotionValue<number>;
  tokenY: MotionValue<number>;
}) {
  const x = useTransform(
    progress,
    [0.5, 0.64, 0.86],
    prefersReducedMotion ? [0, 0, 0] : [28, 0, -4],
  );
  const opacity = useTransform(
    progress,
    [0.48, 0.62],
    prefersReducedMotion ? [1, 1] : [0.52, 1],
  );

  return (
    <motion.div style={{ x, opacity }} className="motioncode-bridge-export-panel">
      <div className="motioncode-bridge-export-tabs" aria-label="Export formats">
        {exportTabs.map((tab, index) => (
          <span key={tab} data-active={index === 0 ? "true" : "false"}>
            {tab}
          </span>
        ))}
      </div>
      <pre aria-label="Generated CSS snippet">
        {codeLines.map((line) => (
          <code key={line}>{line}</code>
        ))}
      </pre>
      <div className="motioncode-bridge-qa-list" aria-label="Export QA checklist">
        <span>
          <CheckCircle2 size={14} strokeWidth={1.9} />
          reduced-motion fallback
        </span>
        <span>
          <Gauge size={14} strokeWidth={1.9} />
          transform-only output
        </span>
        <span>
          <Braces size={14} strokeWidth={1.9} />
          token-ready values
        </span>
      </div>
      <motion.div
        className="motioncode-bridge-token-dock"
        style={{ opacity: tokenOpacity, y: tokenY }}
        aria-label="Resolved motion tokens"
      >
        {remapTokens.map((token) => (
          <span key={token.label}>
            <small>{token.label}</small>
            <strong>{token.value}</strong>
          </span>
        ))}
      </motion.div>
    </motion.div>
  );
}

function ScrollBridgeStory({
  progress,
  prefersReducedMotion,
}: {
  progress: MotionValue<number>;
  prefersReducedMotion: boolean;
}) {
  const haloX = useTransform(
    progress,
    [0, 0.5, 1],
    prefersReducedMotion ? ["0%", "0%", "0%"] : ["-16%", "0%", "18%"],
  );
  const previewScale = useTransform(
    progress,
    [0, 0.12, 0.86, 1],
    prefersReducedMotion ? [1, 1, 1, 1] : [0.96, 1, 1, 0.985],
  );
  const scanX = useTransform(
    progress,
    [0.12, 0.42, 0.66],
    prefersReducedMotion ? ["220%", "220%", "220%"] : ["-135%", "230%", "585%"],
  );
  const scanOpacity = useTransform(
    progress,
    [0.1, 0.2, 0.58, 0.7],
    prefersReducedMotion ? [0, 0, 0, 0] : [0, 0.88, 0.72, 0],
  );
  const pathLength = useTransform(
    progress,
    [0.28, 0.62],
    prefersReducedMotion ? [1, 1] : [0, 1],
  );
  const packetX = useTransform(
    progress,
    [0.28, 0.62],
    prefersReducedMotion ? [70.9, 70.9] : [29.3, 70.9],
  );
  const packetY = useTransform(
    progress,
    [0.28, 0.44, 0.62],
    prefersReducedMotion ? [50, 50, 50] : [54, 43, 50],
  );
  const tokenOpacity = useTransform(
    progress,
    [0.58, 0.72],
    prefersReducedMotion ? [1, 1] : [0, 1],
  );
  const tokenY = useTransform(
    progress,
    [0.58, 0.72],
    prefersReducedMotion ? [0, 0] : [18, 0],
  );

  return (
    <div className="motioncode-bridge-story">
      <motion.div
        className="motioncode-bridge-story-halo"
        style={{ x: haloX }}
        aria-hidden="true"
      />
      <StageList progress={progress} prefersReducedMotion={prefersReducedMotion} />
      <motion.div
        style={{ scale: previewScale }}
        className="motioncode-bridge-workbench"
      >
        <motion.div
          className="motioncode-bridge-scan-sweep"
          style={{ x: scanX, opacity: scanOpacity }}
          aria-hidden="true"
        />
        <svg
          className="motioncode-bridge-remap-svg"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <path
            className="motioncode-bridge-remap-base"
            d="M29.3 54 C43 43 58 43 70.9 50"
          />
          <motion.path
            className="motioncode-bridge-remap-active"
            d="M29.3 54 C43 43 58 43 70.9 50"
            style={{ pathLength }}
          />
          <motion.circle
            className="motioncode-bridge-remap-packet"
            r="0.82"
            style={{ cx: packetX, cy: packetY }}
          />
        </svg>
        <SourceClip progress={progress} prefersReducedMotion={prefersReducedMotion} />
        <MotionMap progress={progress} prefersReducedMotion={prefersReducedMotion} />
        <ExportPanel
          progress={progress}
          prefersReducedMotion={prefersReducedMotion}
          tokenOpacity={tokenOpacity}
          tokenY={tokenY}
        />
      </motion.div>
      <div className="motioncode-bridge-artifacts">
        <article>
          <Sparkles size={16} strokeWidth={1.8} />
          <strong>Inspectable spec</strong>
          <span>Frames, easing, and transform intent stay visible through handoff.</span>
        </article>
        <article>
          <Code2 size={16} strokeWidth={1.8} />
          <strong>Framework exports</strong>
          <span>CSS, GSAP, and Motion snippets are generated from the same motion read.</span>
        </article>
        <article>
          <ShieldCheck size={16} strokeWidth={1.8} />
          <strong>QA-ready output</strong>
          <span>Reduced-motion and transform-safety notes ship with the export bundle.</span>
        </article>
      </div>
    </div>
  );
}

export function ScrollSolutionBridge() {
  return (
    <section
      id="motion-bridge"
      className="motioncode-scroll-bridge"
      data-testid="scroll-solution-bridge"
      aria-labelledby="motion-bridge-heading"
    >
      <ContainerScroll
        className="motioncode-scroll-bridge-container"
        cardClassName="motioncode-scroll-bridge-card"
        contentClassName="motioncode-scroll-bridge-card-inner"
        titleComponent={
          <div className="motioncode-scroll-bridge-heading">
            <p className="motioncode-scroll-bridge-kicker">Motion analysis</p>
            <h2 id="motion-bridge-heading">
              <span className="motioncode-scroll-bridge-title-meta">
                Upload a reference.
              </span>
              <span className="motioncode-scroll-bridge-title-main">
                Convert motion into production code.
              </span>
            </h2>
            <p>
              Scroll the pipeline: frames are sampled, motion is mapped, and
              exports leave with QA context attached.
            </p>
          </div>
        }
      >
        {(progress, prefersReducedMotion) => (
          <ScrollBridgeStory
            progress={progress}
            prefersReducedMotion={prefersReducedMotion}
          />
        )}
      </ContainerScroll>
    </section>
  );
}
