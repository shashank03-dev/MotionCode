import type { MotionSpec } from "@/lib/contracts/motion";
import { getAccessibilityStatus } from "@/lib/motionSpecEditor";

import styles from "./Scorecard.module.css";
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
  const easingType = spec.easing.split("(")[0].split("-")[0] || "custom";

  return (
    <section
      aria-label="Analysis quality scorecard"
      className={styles.scorecard}
    >
      <ScoreItem
        label="Performance"
        meter={spec.performanceScore}
        meterText={`${spec.performanceScore} out of 100`}
        onHover={onHoveredScoreChange}
        scoreKey="perf"
        tone={getPerfTone(spec.performanceScore)}
        value={`${spec.performanceScore}/100`}
      />
      <ScoreItem
        label="Acceleration"
        meter={spec.gpuAccelerated ? 92 : 54}
        meterText={
          spec.gpuAccelerated
            ? "GPU acceleration preferred"
            : "CPU-bound animation risk"
        }
        onHover={onHoveredScoreChange}
        scoreKey="accel"
        tone={spec.gpuAccelerated ? "good" : "warn"}
        value={spec.gpuAccelerated ? "GPU" : "CPU"}
      />
      <ScoreItem
        label="Accessibility"
        meter={accessibilityStatus === "needs-fix" ? 58 : 88}
        meterText={
          accessibilityStatus === "needs-fix"
            ? "Reduced motion note needs attention"
            : "Reduced motion guidance included"
        }
        onHover={onHoveredScoreChange}
        scoreKey="a11y"
        tone={accessibilityStatus === "needs-fix" ? "warn" : "good"}
        value={accessibilityStatus === "needs-fix" ? "Fix" : "Pass"}
      />
      <ScoreItem
        label="Easing"
        meter={78}
        meterText={`${easingType} easing detected`}
        onHover={onHoveredScoreChange}
        scoreKey="easing"
        tone="neutral"
        value={easingType}
      />

      {hoveredScore && (
        <div className={styles.tooltip} role="tooltip">
          {TOOLTIP_COPY[hoveredScore]}
        </div>
      )}
    </section>
  );
}

type ScoreItemProps = {
  label: string;
  meter: number;
  meterText: string;
  onHover: (score: ScoreKey | null) => void;
  scoreKey: ScoreKey;
  tone: "bad" | "good" | "neutral" | "warn";
  value: string;
};

function ScoreItem({
  label,
  meter,
  meterText,
  onHover,
  scoreKey,
  tone,
  value,
}: ScoreItemProps) {
  return (
    <div
      className={`${styles.item} ${styles[tone]}`}
      onFocus={() => onHover(scoreKey)}
      onMouseEnter={() => onHover(scoreKey)}
      onMouseLeave={() => onHover(null)}
      onBlur={() => onHover(null)}
      tabIndex={0}
    >
      <div className={styles.itemTop}>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      <meter
        aria-label={`${label}: ${meterText}`}
        aria-valuetext={meterText}
        className={styles.meter}
        high={85}
        low={60}
        max={100}
        min={0}
        optimum={100}
        value={getMeterValue(meter)}
      />
    </div>
  );
}

function getMeterValue(value: number) {
  return Math.min(100, Math.max(0, value));
}

function getPerfTone(score: number): "bad" | "good" | "warn" {
  if (score >= 85) return "good";
  if (score >= 65) return "warn";
  return "bad";
}
