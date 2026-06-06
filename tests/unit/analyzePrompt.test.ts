import { describe, expect, it } from "vitest";
import { buildAnimationPrompt } from "@/app/api/analyze/prompt";

describe("buildAnimationPrompt", () => {
  it("includes frame count and JSON-only instructions", () => {
    const prompt = buildAnimationPrompt(4);

    expect(prompt).toContain("analyzing 4 frames");
    expect(prompt).toContain("Raw JSON only");
    expect(prompt).toContain("react_spring");
  });
});
