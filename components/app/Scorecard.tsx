import { useState } from "react";
import type { AnimationAnalysisResult } from "@/lib/animationResult";

type ScoreKey = "perf" | "accel" | "a11y" | "easing";

type ScorecardProps = {
  result: AnimationAnalysisResult;
};

export function Scorecard({ result }: ScorecardProps) {
  const [hoveredScore, setHoveredScore] = useState<ScoreKey | null>(null);
  const needsAccessibilityFix =
    result.accessibility_note.toLowerCase().includes("add") ||
    result.accessibility_note.toLowerCase().includes("missing");

  return (
    <div style={{ borderTop: "1px solid #1a1a1a", padding: "16px 24px", display: "flex", gap: 16, position: "relative" }}>
      <div
        onMouseEnter={() => setHoveredScore("perf")}
        onMouseLeave={() => setHoveredScore(null)}
        style={{ display: "flex", flexDirection: "column", gap: 4, paddingRight: 16, borderRight: "1px solid #1a1a1a", cursor: "help" }}
      >
        <div style={{
          fontFamily: "Space Mono, monospace", fontSize: 16, fontWeight: "bold",
          color: result.performance_score >= 85 ? "#00ff88" : result.performance_score >= 65 ? "#f59e0b" : "#ef4444"
        }}>
          {result.performance_score}/100
        </div>
        <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: 1, color: "#3a3a4a" }}>PERF SCORE</div>
      </div>

      <div
        onMouseEnter={() => setHoveredScore("accel")}
        onMouseLeave={() => setHoveredScore(null)}
        style={{ display: "flex", flexDirection: "column", gap: 4, paddingRight: 16, borderRight: "1px solid #1a1a1a", cursor: "help" }}
      >
        <div style={{
          fontFamily: "Space Mono, monospace", fontSize: 16, fontWeight: "bold",
          color: result.gpu_accelerated ? "#00ff88" : "#f59e0b"
        }}>
          {result.gpu_accelerated ? "✓ GPU" : "✗ CPU"}
        </div>
        <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: 1, color: "#3a3a4a" }}>ACCELERATION</div>
      </div>

      <div
        onMouseEnter={() => setHoveredScore("a11y")}
        onMouseLeave={() => setHoveredScore(null)}
        style={{ display: "flex", flexDirection: "column", gap: 4, paddingRight: 16, borderRight: "1px solid #1a1a1a", cursor: "help" }}
      >
        <div style={{
          fontFamily: "Space Mono, monospace", fontSize: 16, fontWeight: "bold",
          color: needsAccessibilityFix ? "#f59e0b" : "#00ff88"
        }}>
          {needsAccessibilityFix ? "⚠ Fix" : "✓ Pass"}
        </div>
        <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: 1, color: "#3a3a4a" }}>ACCESSIBILITY</div>
      </div>

      <div
        onMouseEnter={() => setHoveredScore("easing")}
        onMouseLeave={() => setHoveredScore(null)}
        style={{ display: "flex", flexDirection: "column", gap: 4, cursor: "help" }}
      >
        <div style={{ fontFamily: "Space Mono, monospace", fontSize: 16, fontWeight: "bold", color: "#e2e8f0" }}>
          {result.easing.split("(")[0].split("-")[0]}
        </div>
        <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, letterSpacing: 1, color: "#3a3a4a" }}>EASING TYPE</div>
      </div>

      {hoveredScore && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 12px)", left: 24,
          background: "#0a0a0a", border: "1px solid #1a1a1a",
          padding: "8px 12px", maxWidth: 220, zIndex: 100,
          fontFamily: "Space Mono, monospace", fontSize: 10, color: "#3a3a4a",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)"
        }}>
          {hoveredScore === "perf" && "Measures GPU acceleration, paint complexity, and composite layer usage"}
          {hoveredScore === "accel" && "GPU-accelerated animations use transform and opacity — no layout thrashing"}
          {hoveredScore === "a11y" && "WCAG requires prefers-reduced-motion support for vestibular disorders"}
          {hoveredScore === "easing" && "The timing function controlling acceleration curve"}
        </div>
      )}
    </div>
  );
}
