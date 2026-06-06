import type { CSSProperties, ReactNode } from "react";

import type { AnalysisResult, MotionIntent } from "@/lib/contracts/motion";
import type { MotionSpecEditableField } from "@/lib/motionSpecEditor";

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

const inputStyle = {
  background: "#050505",
  border: "1px solid #1a1a1a",
  color: "#e2e8f0",
  fontFamily: "Space Mono, monospace",
  fontSize: 11,
  minWidth: 0,
  padding: "5px 7px",
} satisfies CSSProperties;

export function MotionSpecPanel({
  intentColor,
  onReset,
  onSpecChange,
  result,
}: MotionSpecPanelProps) {
  const { spec } = result;

  return (
    <div style={{ borderBottom: "1px solid #1a1a1a", padding: "12px 24px" }}>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 16,
          justifyContent: "space-between",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 16, minWidth: 0 }}>
          <div
            style={{
              backgroundColor: `${intentColor}26`,
              border: `1px solid ${intentColor}`,
              color: intentColor,
              fontFamily: "Space Mono, monospace",
              fontSize: 11,
              padding: "3px 10px",
            }}
          >
            {spec.intent.toUpperCase()}
          </div>
          <div
            style={{
              color: "#3a3a4a",
              fontFamily: "Inter, sans-serif",
              fontSize: 12,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {spec.description}
          </div>
        </div>
        <button
          onClick={onReset}
          onMouseOut={(event) => {
            event.currentTarget.style.borderColor = "#1a1a1a";
            event.currentTarget.style.color = "#3a3a4a";
          }}
          onMouseOver={(event) => {
            event.currentTarget.style.borderColor = "#3a3a4a";
            event.currentTarget.style.color = "#e2e8f0";
          }}
          style={{
            backgroundColor: "transparent",
            border: "1px solid #1a1a1a",
            color: "#3a3a4a",
            cursor: "pointer",
            fontFamily: "Space Mono, monospace",
            fontSize: 10,
            padding: "4px 12px",
            transition: "all 0.2s",
          }}
        >
          New Analysis
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
          marginTop: 12,
        }}
      >
        <Field label="INTENT">
          <select
            onChange={(event) => onSpecChange("intent", event.target.value)}
            style={inputStyle}
            value={spec.intent}
          >
            {INTENTS.map((intent) => (
              <option key={intent} value={intent}>
                {intent}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ELEMENT">
          <input
            onChange={(event) => onSpecChange("element", event.target.value)}
            style={inputStyle}
            value={spec.element}
          />
        </Field>
        <Field label="DURATION">
          <input
            min={0}
            onChange={(event) => onSpecChange("durationMs", event.target.value)}
            style={inputStyle}
            type="number"
            value={spec.durationMs}
          />
        </Field>
        <Field label="DELAY">
          <input
            min={0}
            onChange={(event) => onSpecChange("delayMs", event.target.value)}
            style={inputStyle}
            type="number"
            value={spec.delayMs}
          />
        </Field>
        <Field label="EASING">
          <input
            onChange={(event) => onSpecChange("easing", event.target.value)}
            style={inputStyle}
            value={spec.easing}
          />
        </Field>
        <Field label="LOOPS">
          <label
            style={{
              alignItems: "center",
              color: "#e2e8f0",
              display: "flex",
              fontFamily: "Space Mono, monospace",
              fontSize: 11,
              gap: 8,
              height: 28,
            }}
          >
            <input
              checked={spec.loops}
              onChange={(event) => onSpecChange("loops", event.target.checked)}
              type="checkbox"
            />
            {spec.loops ? "yes" : "no"}
          </label>
        </Field>
      </div>

      <div style={{ marginTop: 8 }}>
        <Field label="DESCRIPTION">
          <input
            onChange={(event) => onSpecChange("description", event.target.value)}
            style={{ ...inputStyle, width: "100%" }}
            value={spec.description}
          />
        </Field>
      </div>
    </div>
  );
}

type FieldProps = {
  children: ReactNode;
  label: string;
};

function Field({ children, label }: FieldProps) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <span
        style={{
          color: "#3a3a4a",
          fontFamily: "Space Mono, monospace",
          fontSize: 9,
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
