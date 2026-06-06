import { describe, expect, it } from "vitest";

import type { AnalysisResult, MotionSpec } from "@/lib/contracts/motion";
import {
  getAccessibilityStatus,
  updateAnalysisResultSpec,
  updateMotionSpec,
} from "@/lib/motionSpecEditor";

const spec: MotionSpec = {
  accessibilityNote: "Add prefers-reduced-motion fallback.",
  delayMs: 0,
  description: "The element scales down.",
  durationMs: 400,
  easing: "ease-out",
  element: "button",
  gpuAccelerated: true,
  implementationNotes: ["Use transform only."],
  intent: "hover",
  keyframesDetected: 2,
  loops: false,
  performanceScore: 92,
};

const result: AnalysisResult = {
  assetId: "asset_123",
  createdAt: "2026-06-06T12:00:00.000Z",
  frameCount: 4,
  id: "analysis_123",
  model: "gemini-2.5-flash",
  outputs: [],
  projectId: "project_123",
  spec,
  versionId: "version_123",
};

describe("motion spec editor helpers", () => {
  it("normalizes bounded numeric fields", () => {
    expect(updateMotionSpec(spec, "durationMs", "450.7").durationMs).toBe(451);
    expect(updateMotionSpec(spec, "delayMs", "-10").delayMs).toBe(0);
    expect(updateMotionSpec(spec, "performanceScore", "140").performanceScore)
      .toBe(100);
    expect(updateMotionSpec(spec, "keyframesDetected", Number.NaN))
      .toEqual(spec);
  });

  it("parses boolean and implementation note edits", () => {
    expect(updateMotionSpec(spec, "loops", "true").loops).toBe(true);
    expect(updateMotionSpec(spec, "gpuAccelerated", false).gpuAccelerated)
      .toBe(false);
    expect(
      updateMotionSpec(spec, "implementationNotes", "Use opacity\n\nAvoid top")
        .implementationNotes,
    ).toEqual(["Use opacity", "Avoid top"]);
  });

  it("updates analysis results immutably", () => {
    const updated = updateAnalysisResultSpec(result, "easing", "linear");

    expect(updated).not.toBe(result);
    expect(updated.spec).not.toBe(spec);
    expect(updated.spec.easing).toBe("linear");
    expect(result.spec.easing).toBe("ease-out");
  });

  it("classifies accessibility notes for scorecard display", () => {
    expect(getAccessibilityStatus("Add prefers-reduced-motion fallback.")).toBe(
      "needs-fix",
    );
    expect(getAccessibilityStatus("Reduced motion fallback is included.")).toBe(
      "pass",
    );
  });
});
