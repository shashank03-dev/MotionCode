import { describe, expect, it } from "vitest";

import type { AnalysisResult } from "@/lib/contracts/motion";
import {
  parseSavedAnalysisResult,
  parseSavedMotionSpec,
} from "@/lib/contracts/savedAnalysis";

function fullResult(): AnalysisResult {
  return {
    assetId: "asset-1",
    createdAt: "2026-07-01T10:00:00.000Z",
    frameCount: 8,
    id: "analysis-1",
    model: "gemini-2.5-pro",
    outputs: [
      {
        code: ".box { animation: pop 300ms ease-out; }",
        dependencies: [],
        framework: "css",
        setupNotes: [],
        warnings: [],
      },
    ],
    projectId: "project-1",
    spec: {
      accessibilityNote: "Respects prefers-reduced-motion.",
      delayMs: 0,
      description: "A card pops in.",
      durationMs: 300,
      easing: "ease-out",
      element: "card",
      gpuAccelerated: true,
      implementationNotes: ["Use transform"],
      intent: "entrance",
      keyframesDetected: 3,
      loops: false,
      performanceScore: 92,
    },
    versionId: "version-1",
  };
}

describe("parseSavedAnalysisResult", () => {
  it("round-trips a full analysis result", () => {
    const result = fullResult();
    expect(parseSavedAnalysisResult(JSON.parse(JSON.stringify(result)))).toEqual(
      result,
    );
  });

  it("returns null for a spec-only payload (legacy manual versions)", () => {
    expect(parseSavedAnalysisResult(fullResult().spec)).toBeNull();
  });

  it("returns null for arbitrary JSON", () => {
    expect(parseSavedAnalysisResult({ hello: "world" })).toBeNull();
    expect(parseSavedAnalysisResult(null)).toBeNull();
    expect(parseSavedAnalysisResult("spec")).toBeNull();
  });

  it("returns null when outputs are missing or empty", () => {
    const result = fullResult();
    expect(parseSavedAnalysisResult({ ...result, outputs: [] })).toBeNull();
  });
});

describe("parseSavedMotionSpec", () => {
  it("parses a bare motion spec", () => {
    const spec = fullResult().spec;
    expect(parseSavedMotionSpec(spec)).toEqual(spec);
  });

  it("returns null for non-spec payloads", () => {
    expect(parseSavedMotionSpec({ intent: "entrance" })).toBeNull();
  });
});
