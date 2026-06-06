import type { AnalysisResult, MotionSpec } from "@/lib/contracts/motion";

export type MotionSpecEditableField =
  | "accessibilityNote"
  | "delayMs"
  | "description"
  | "durationMs"
  | "easing"
  | "element"
  | "gpuAccelerated"
  | "implementationNotes"
  | "intent"
  | "keyframesDetected"
  | "loops"
  | "performanceScore";

export type AccessibilityStatus = "needs-fix" | "pass";

export function updateAnalysisResultSpec(
  result: AnalysisResult,
  field: MotionSpecEditableField,
  value: unknown,
): AnalysisResult {
  return {
    ...result,
    spec: updateMotionSpec(result.spec, field, value),
  };
}

export function updateMotionSpec(
  spec: MotionSpec,
  field: MotionSpecEditableField,
  value: unknown,
): MotionSpec {
  switch (field) {
    case "delayMs":
    case "durationMs":
    case "keyframesDetected": {
      const parsed = normalizeInteger(value, { max: Number.MAX_SAFE_INTEGER, min: 0 });
      return parsed === null ? spec : { ...spec, [field]: parsed };
    }
    case "performanceScore": {
      const parsed = normalizeInteger(value, { max: 100, min: 0 });
      return parsed === null ? spec : { ...spec, performanceScore: parsed };
    }
    case "gpuAccelerated":
    case "loops": {
      return { ...spec, [field]: normalizeBoolean(value) };
    }
    case "implementationNotes": {
      return { ...spec, implementationNotes: normalizeNotes(value) };
    }
    default:
      return { ...spec, [field]: String(value) };
  }
}

export function getAccessibilityStatus(note: string): AccessibilityStatus {
  const normalized = note.toLowerCase();
  return normalized.includes("add") ||
    normalized.includes("fix") ||
    normalized.includes("missing")
    ? "needs-fix"
    : "pass";
}

function normalizeInteger(
  value: unknown,
  { max, min }: { max: number; min: number },
) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }

  return Boolean(value);
}

function normalizeNotes(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }

  return String(value)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}
