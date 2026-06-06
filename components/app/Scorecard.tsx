import type { MotionSpec } from "@/lib/contracts/motion";
import { getAccessibilityStatus } from "@/lib/motionSpecEditor";

import type { ScoreKey } from "./types";

type ScorecardProps = {
  hoveredScore: ScoreKey | null;
  onHoveredScoreChange: (score: ScoreKey | null) => void;
  spec: MotionSpec;
};

const TOOLTIP_COPY: Record<ScoreKey, string> = {
  a11y: "Checks whether reduced-motion guidance is included.",
  accel: "GPU-friendly output prefers transform and opacity.",
  easing: "The timing function controlling acceleration.",
  perf: "Estimates paint complexity and composite layer usage.",
};

export function Scorecard({
  hoveredScore,
  onHoveredScoreChange,
  spec,
}: ScorecardProps) {
  const accessibilityStatus = getAccessibilityStatus(spec.accessibilityNote);

  return (
    <div
      style={{
        borderTop: "1px solid #1a1a1a",
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        padding: "16px 24px",
        position: "relative",
      }}
    >
      <ScoreItem
        label="PERF SCORE"
        onHover={onHoveredScoreChange}
        scoreKey="perf"
        value={`${spec.performanceScore}/100`}
        valueColor={
          spec.performanceScore >= 85
            ? "#00ff88"
            : spec.performanceScore >= 65
              ? "#f59e0b"
              : "#ef4444"
        }
      />
      <ScoreItem
        label="ACCELERATION"
        onHover={onHoveredScoreChange}
        scoreKey="accel"
        value={spec.gpuAccelerated ? "GPU" : "CPU"}
        valueColor={spec.gpuAccelerated ? "#00ff88" : "#f59e0b"}
      />
      <ScoreItem
        label="ACCESSIBILITY"
        onHover={onHoveredScoreChange}
        scoreKey="a11y"
        value={accessibilityStatus === "needs-fix" ? "Fix" : "Pass"}
        valueColor={accessibilityStatus === "needs-fix" ? "#f59e0b" : "#00ff88"}
      />
      <ScoreItem
        label="EASING TYPE"
        onHover={onHoveredScoreChange}
        scoreKey="easing"
        value={spec.easing.split("(")[0].split("-")[0]}
        valueColor="#e2e8f0"
        withDivider={false}
      />

      {hoveredScore && (
        <div
          style={{
            background: "#0a0a0a",
            border: "1px solid #1a1a1a",
            bottom: "calc(100% + 12px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            color: "#3a3a4a",
            fontFamily: "Space Mono, monospace",
            fontSize: 10,
            left: 24,
            maxWidth: 220,
            padding: "8px 12px",
            position: "absolute",
            zIndex: 100,
          }}
        >
          {TOOLTIP_COPY[hoveredScore]}
        </div>
      )}
    </div>
  );
}

type ScoreItemProps = {
  label: string;
  onHover: (score: ScoreKey | null) => void;
  scoreKey: ScoreKey;
  value: string;
  valueColor: string;
  withDivider?: boolean;
};

function ScoreItem({
  label,
  onHover,
  scoreKey,
  value,
  valueColor,
  withDivider = true,
}: ScoreItemProps) {
  return (
    <div
      onMouseEnter={() => onHover(scoreKey)}
      onMouseLeave={() => onHover(null)}
      style={{
        borderRight: withDivider ? "1px solid #1a1a1a" : "none",
        cursor: "help",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        paddingRight: withDivider ? 16 : 0,
      }}
    >
      <div
        style={{
          color: valueColor,
          fontFamily: "Space Mono, monospace",
          fontSize: 16,
          fontWeight: "bold",
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: "#3a3a4a",
          fontFamily: "Space Mono, monospace",
          fontSize: 9,
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
    </div>
  );
}
