import { describe, expect, it } from "vitest";
import { normalizeAnalysisResult } from "@/lib/animationResult";
import { analysisRequestSchema } from "@/app/api/analyze/schema";

describe("analysis schemas", () => {
  const validAnalysisResult = {
    intent: "hover",
    element: "button",
    duration_ms: 300,
    easing: "ease-out",
    description: "A subtle hover scale.",
    css: ".el{transform:scale(.98)}",
    gsap: "gsap.to('.el',{scale:.98})",
    framer_motion: "const v={animate:{scale:.98}}",
    react_spring: "const s={scale:.98}",
  };

  it("accepts bounded frame payloads", () => {
    const result = analysisRequestSchema.parse({
      frames: ["abc"],
      frameCount: 1,
    });

    expect(result.frames).toEqual(["abc"]);
  });

  it("rejects too many frames", () => {
    expect(() =>
      analysisRequestSchema.parse({
        frames: Array.from({ length: 13 }, () => "abc"),
        frameCount: 13,
      })
    ).toThrow();
  });

  it("accepts numeric strings for numeric fields", () => {
    const request = analysisRequestSchema.parse({
      frames: ["abc"],
      frameCount: "1",
    });
    const result = normalizeAnalysisResult({
      ...validAnalysisResult,
      duration_ms: "300",
      delay_ms: "25",
      keyframes_detected: "2",
      performance_score: "87",
    });

    expect(request.frameCount).toBe(1);
    expect(result).toMatchObject({
      duration_ms: 300,
      delay_ms: 25,
      keyframes_detected: 2,
      performance_score: 87,
    });
  });

  it("rejects invalid numeric values instead of coercing them", () => {
    const invalidNumbers = [null, "", "   ", true, false];

    for (const value of invalidNumbers) {
      expect(() =>
        normalizeAnalysisResult({
          ...validAnalysisResult,
          duration_ms: value,
        })
      ).toThrow();

      expect(() =>
        analysisRequestSchema.parse({
          frames: ["abc"],
          frameCount: value,
        })
      ).toThrow();
    }
  });

  it("rejects frame counts that do not match the frames payload", () => {
    expect(() =>
      analysisRequestSchema.parse({
        frames: ["abc", "def"],
        frameCount: 1,
      })
    ).toThrow();
  });

  it("fills missing optional result fields safely", () => {
    expect(normalizeAnalysisResult(validAnalysisResult)).toMatchObject({
      performance_score: 0,
      gpu_accelerated: false,
      accessibility_note: "Not assessed",
    });
  });
});
