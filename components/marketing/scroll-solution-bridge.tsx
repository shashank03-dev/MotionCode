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
  Sparkles,
  Upload,
  Waypoints,
} from "lucide-react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

const leftSignals = [
  { label: "Video", detail: "MP4 / WebM", icon: FileVideo },
  { label: "Frames", detail: "8-24 samples", icon: Layers3 },
  { label: "Curves", detail: "Bezier map", icon: Waypoints },
  { label: "Intent", detail: "motion read", icon: ScanLine },
];

const rightSignals = [
  { label: "CSS", detail: "tokens ready", icon: Braces },
  { label: "GSAP", detail: "timeline", icon: Sparkles },
  { label: "Framer", detail: "variants", icon: Code2 },
  { label: "QA", detail: "a11y checks", icon: CheckCircle2 },
];

const pipelineNodes = [
  {
    label: "Capture",
    detail: "source locked",
    icon: Upload,
  },
  {
    label: "Analyze",
    detail: "motion kernel",
    icon: ScanLine,
  },
  {
    label: "Export",
    detail: "ship-ready",
    icon: Code2,
  },
];

const proofCards = [
  {
    label: "Performance score",
    value: "94",
    body: "Composite-safe transforms and reduced repaint risk before export.",
  },
  {
    label: "Framework output",
    value: "3",
    body: "CSS, GSAP, and Framer Motion generated from the same read.",
  },
  {
    label: "Review time",
    value: "<30s",
    body: "A visual reference becomes inspectable production code quickly.",
  },
];

function SignalStack({
  items,
  side,
}: {
  items: typeof leftSignals;
  side: "left" | "right";
}) {
  return (
    <div className={`motioncode-bridge-signal-stack motioncode-bridge-signal-stack-${side}`}>
      {items.map((item, index) => {
        const Icon = item.icon;

        return (
          <div
            key={item.label}
            className="motioncode-bridge-signal"
            style={{ animationDelay: `${index * 130}ms` }}
          >
            <Icon aria-hidden="true" size={15} strokeWidth={1.8} />
            <span>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PipelineNode({
  node,
  index,
}: {
  node: (typeof pipelineNodes)[number];
  index: number;
}) {
  const Icon = node.icon;

  return (
    <div
      className={`motioncode-bridge-pipeline-node ${
        index === 1 ? "motioncode-bridge-pipeline-node-core" : ""
      }`}
      style={{ animationDelay: `${index * 160}ms` }}
    >
      <span className="motioncode-bridge-node-icon" aria-hidden="true">
        <Icon size={22} strokeWidth={1.7} />
      </span>
      <span className="motioncode-bridge-node-copy">
        <strong>{node.label}</strong>
        <small>{node.detail}</small>
      </span>
    </div>
  );
}

function MotionPipelineDiagram() {
  return (
    <div className="motioncode-bridge-diagram" aria-label="MotionCode analysis pipeline">
      <div className="motioncode-bridge-diagram-grid" aria-hidden="true" />
      <div className="motioncode-bridge-core-glow" aria-hidden="true" />

      <SignalStack items={leftSignals} side="left" />

      <div className="motioncode-bridge-pipeline">
        {pipelineNodes.map((node, index) => (
          <React.Fragment key={node.label}>
            <PipelineNode node={node} index={index} />
            {index < pipelineNodes.length - 1 ? (
              <span className="motioncode-bridge-rail" aria-hidden="true">
                <span />
              </span>
            ) : null}
          </React.Fragment>
        ))}
      </div>

      <SignalStack items={rightSignals} side="right" />
    </div>
  );
}

export function ScrollSolutionBridge() {
  return (
    <section
      id="motion-bridge"
      className="motioncode-scroll-bridge"
      data-testid="scroll-solution-bridge"
    >
      <div className="motioncode-section-index">02 /</div>
      <ContainerScroll
        className="motioncode-scroll-bridge-container"
        cardClassName="motioncode-scroll-bridge-card"
        contentClassName="motioncode-scroll-bridge-card-inner"
        titleComponent={
          <div className="motioncode-scroll-bridge-heading">
            <div className="motioncode-scroll-bridge-kicker">Motion bridge</div>
            <h2>
              <span className="motioncode-scroll-bridge-title-meta">
                Reference in.
              </span>
              <span className="motioncode-scroll-bridge-title-main">
                Motion code out.
              </span>
            </h2>
            <p>
              Upload an animation. MotionCode maps the moving parts and returns
              framework-ready CSS, GSAP, and Framer Motion you can inspect before
              shipping.
            </p>
          </div>
        }
      >
        <div className="motioncode-bridge-card-content">
          <MotionPipelineDiagram />

          <div className="motioncode-bridge-proof-grid">
            {proofCards.map((card) => (
              <article key={card.label} className="motioncode-bridge-proof-card">
                <div>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </div>
                <p>{card.body}</p>
              </article>
            ))}
          </div>

          <div className="motioncode-bridge-status" aria-hidden="true">
            <Gauge size={14} strokeWidth={1.8} />
            <span>scroll-driven preview</span>
            <span>composite-only</span>
            <span>reduced-motion safe</span>
          </div>
        </div>
      </ContainerScroll>
    </section>
  );
}
