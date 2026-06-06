/* eslint-disable @next/next/no-img-element */

import type { AnimationAnalysisResult } from "@/lib/animationResult";
import type { CodeTab } from "@/lib/generatedCode";
import { FREE_LIMIT } from "@/lib/rateLimit";
import { CodeOutput } from "./CodeOutput";
import { Scorecard } from "./Scorecard";
import type { AppStage } from "./AppShell";

const intentColors: Record<string, string> = {
  morph: "#00ff88",
  hover: "#f59e0b",
  entrance: "#3b82f6",
  exit: "#ef4444",
  loading: "#8b5cf6",
  loop: "#10b981",
};

const statusMessages = [
  "Analyzing motion patterns...",
  "Reading easing curves...",
  "Detecting transform paths...",
  "Almost there..."
];

type AnalysisPanelProps = {
  stage: AppStage;
  result: AnimationAnalysisResult | null;
  frames: string[];
  frameThumbs: string[];
  activeTab: CodeTab;
  activeStep: number;
  scannerIndex: number;
  statusBarMsgIndex: number;
  statusMessage: string;
  progressWidth: number;
  error: string | null;
  onTabChange: (tab: CodeTab) => void;
  onReset: () => void;
};

export function AnalysisPanel({
  stage,
  result,
  frames,
  frameThumbs,
  activeTab,
  activeStep,
  scannerIndex,
  statusBarMsgIndex,
  statusMessage,
  progressWidth,
  error,
  onTabChange,
  onReset,
}: AnalysisPanelProps) {
  const stepsList = [
    `Extracting ${frames.length || 8} frames from video...`,
    "Sending frames to AI vision model...",
    "Detecting motion vectors...",
    "Analyzing easing curves...",
    "Identifying animation intent...",
    "Generating CSS keyframes...",
    "Generating GSAP timeline...",
    "Generating Framer Motion variants...",
    "Running performance audit...",
    "Checking accessibility compliance...",
    "Compiling output..."
  ];
  const intentColor = result ? (intentColors[result.intent.toLowerCase()] || "#00ff88") : "#00ff88";

  return (
    <div id="right-panel" style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#080808", overflow: "hidden", position: "relative" }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: "#1a1a1a", zIndex: 10,
        opacity: stage === "done" ? 0 : (stage === "analyzing" ? 1 : 0),
        transition: stage === "done" ? "opacity 0.4s ease 0.4s" : "none",
        pointerEvents: "none"
      }}>
        <div style={{
          height: "100%", background: "linear-gradient(90deg, #00ff88, #00cc6e)",
          width: stage === "done" ? "100%" : (stage === "analyzing" ? `${progressWidth}%` : "0%"),
          transition: stage === "done" ? "width 0.1s ease-out" : "width 20s cubic-bezier(0.1, 0, 0.3, 1)"
        }} />
      </div>

      {!result ? (
        stage === "analyzing" ? (
          <div style={{ flex: 1, padding: "48px 60px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
              {stepsList.map((step, i) => {
                if (i > activeStep) return null;
                const isActive = i === activeStep;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    animation: "fadeSlideIn 0.3s ease forwards",
                    opacity: 0
                  }}>
                    {isActive ? (
                      <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#00ff88", animation: "blink 0.8s infinite", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 6, textAlign: "center", fontFamily: "Space Mono, monospace", fontSize: 10, color: "#3a3a4a", flexShrink: 0 }}>✓</div>
                    )}
                    <div style={{
                      fontFamily: "Space Mono, monospace", fontSize: 12,
                      color: isActive ? "#e2e8f0" : "#3a3a4a"
                    }}>
                      [{i + 1}] {step}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 40, flexShrink: 0 }}>
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, color: "#3a3a4a", letterSpacing: 2, marginBottom: 8 }}>SCANNING FRAMES</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {frameThumbs.map((thumb, i) => (
                  <div key={i} style={{
                    width: 64, height: 44,
                    border: i === scannerIndex ? "1px solid #00ff88" : "1px solid #1a1a1a",
                    boxShadow: i === scannerIndex ? "0 0 8px #00ff8840" : "none",
                    transition: "all 0.1s ease",
                    display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#000", overflow: "hidden"
                  }}>
                    <img src={thumb} alt={`Frame ${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 60px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {[
                "Drop a video or GIF on the left panel",
                "Choose frame count (8 recommended for accuracy)",
                `Click Analyze. ${FREE_LIMIT} free uses per day.`,
                "Get production code in CSS, GSAP, Framer Motion, React Spring"
              ].map((text, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                  <span style={{ fontFamily: "Space Mono, monospace", fontSize: 12, color: "#00ff88" }}>0{i + 1}</span>
                  <span style={{ fontFamily: "Space Mono, monospace", fontSize: 12, color: "#3a3a4a", lineHeight: 2.2 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ borderBottom: "1px solid #1a1a1a", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                fontFamily: "Space Mono, monospace", fontSize: 11, padding: "3px 10px",
                color: intentColor, border: `1px solid ${intentColor}`, backgroundColor: `${intentColor}26`
              }}>
                {result.intent.toUpperCase()}
              </div>
              <div style={{ fontFamily: "Space Mono, monospace", color: "#1a1a1a" }}>·</div>
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "#3a3a4a" }}>{result.element}</div>
              <div style={{ fontFamily: "Space Mono, monospace", color: "#1a1a1a" }}>·</div>
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "#3a3a4a" }}>{result.duration_ms}ms</div>
              <div style={{ fontFamily: "Space Mono, monospace", color: "#1a1a1a" }}>·</div>
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "#3a3a4a" }}>{result.easing}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#3a3a4a", maxWidth: 200, textAlign: "right" }}>
                {result.description}
              </div>
              <button
                onClick={onReset}
                style={{
                  fontFamily: "Space Mono, monospace", fontSize: 10, color: "#3a3a4a",
                  border: "1px solid #1a1a1a", padding: "4px 12px", backgroundColor: "transparent",
                  cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseOver={(event) => {
                  event.currentTarget.style.color = "#e2e8f0";
                  event.currentTarget.style.borderColor = "#3a3a4a";
                }}
                onMouseOut={(event) => {
                  event.currentTarget.style.color = "#3a3a4a";
                  event.currentTarget.style.borderColor = "#1a1a1a";
                }}
              >
                New Analysis ↺
              </button>
            </div>
          </div>

          <CodeOutput result={result} activeTab={activeTab} onTabChange={onTabChange} />
          <Scorecard result={result} />
        </div>
      )}

      <div style={{ borderTop: "1px solid #1a1a1a", padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#080808" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "Space Mono, monospace", fontSize: 11, color: "#3a3a4a" }}>
          {stage === "idle" && (<span>⌘↩ analyze  ·  1-4 switch tabs  ·  ⌘K upload</span>)}

          {stage === "extracting" && (
            <>
              <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#00ff88", animation: "blink 1s ease infinite" }} />
              <span>Extracting frames...</span>
            </>
          )}

          {stage === "analyzing" && (
            <>
              <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#00ff88", animation: "blink 0.8s infinite" }} />
              <span>{statusMessage || statusMessages[statusBarMsgIndex]}</span>
            </>
          )}

          {stage === "done" && result && (
            <span style={{ color: "#00ff88" }}>✓ Analysis complete · {frames.length} frames · {result.intent} detected</span>
          )}

          {stage === "error" && (
            <span style={{ color: "#ef4444" }}>⚠ {error}</span>
          )}
        </div>

        <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "#1a1a1a" }} />
      </div>
    </div>
  );
}
