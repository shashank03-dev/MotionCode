import { RotateCcw } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import type { AnalysisResult, MotionIntent } from "@/lib/contracts/motion";
import type { MotionSpecEditableField } from "@/lib/motionSpecEditor";

import styles from "./MotionSpecPanel.module.css";

type MotionSpecPanelProps = {
  intentColor: string;
  onReset: () => void;
  onSpecChange: (field: MotionSpecEditableField, value: unknown) => void;
  result: AnalysisResult;
};

const INTENTS: MotionIntent[] = [
  "entrance",
  "exit",
  "hover",
  "loading",
  "loop",
  "morph",
  "scroll",
  "unknown",
];

export function MotionSpecPanel({
  intentColor,
  onReset,
  onSpecChange,
  result,
}: MotionSpecPanelProps) {
  const { spec } = result;

  return (
    <section className={styles.panel} aria-labelledby="motion-spec-heading">
      <div className={styles.topline}>
        <div className={styles.summary}>
          <span
            className={styles.intentBadge}
            style={
              {
                "--intent-color": intentColor,
              } as CSSProperties
            }
          >
            {spec.intent}
          </span>
          <div className={styles.summaryText}>
            <h2 id="motion-spec-heading">Motion spec</h2>
            <p>{spec.description}</p>
          </div>
        </div>
        <button className={styles.resetButton} onClick={onReset} type="button">
          <RotateCcw aria-hidden="true" size={14} />
          New analysis
        </button>
      </div>

      <div className={styles.grid}>
        <Field label="Intent">
          <select
            onChange={(event) => onSpecChange("intent", event.target.value)}
            value={spec.intent}
          >
            {INTENTS.map((intent) => (
              <option key={intent} value={intent}>
                {intent}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Element">
          <input
            onChange={(event) => onSpecChange("element", event.target.value)}
            value={spec.element}
          />
        </Field>
        <Field label="Duration">
          <input
            min={0}
            onChange={(event) => onSpecChange("durationMs", event.target.value)}
            type="number"
            value={spec.durationMs}
          />
        </Field>
        <Field label="Delay">
          <input
            min={0}
            onChange={(event) => onSpecChange("delayMs", event.target.value)}
            type="number"
            value={spec.delayMs}
          />
        </Field>
        <Field label="Easing">
          <input
            onChange={(event) => onSpecChange("easing", event.target.value)}
            value={spec.easing}
          />
        </Field>
        <Field label="Loops">
          <label className={styles.loopToggle}>
            <input
              checked={spec.loops}
              onChange={(event) => onSpecChange("loops", event.target.checked)}
              type="checkbox"
            />
            <span>{spec.loops ? "yes" : "no"}</span>
          </label>
        </Field>
      </div>

      <Field label="Description" wide>
        <input
          onChange={(event) => onSpecChange("description", event.target.value)}
          value={spec.description}
        />
      </Field>
    </section>
  );
}

type FieldProps = {
  children: ReactNode;
  label: string;
  wide?: boolean;
};

function Field({ children, label, wide = false }: FieldProps) {
  return (
    <label className={`${styles.field} ${wide ? styles.fieldWide : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
