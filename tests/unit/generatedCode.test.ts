import { describe, expect, it } from "vitest";

import type { AnalysisResult } from "@/lib/contracts/motion";
import {
  CODE_TABS,
  getCodeContent,
  getDownloadFilename,
  getGeneratedOutput,
  highlightCode,
  prettifyCode,
} from "@/lib/generatedCode";

const result: AnalysisResult = {
  assetId: "asset_123",
  createdAt: "2026-06-06T12:00:00.000Z",
  frameCount: 4,
  id: "analysis_123",
  model: "gemini-2.5-flash",
  outputs: [
    {
      code: ".el{transform:scale(.95);opacity:.5}",
      dependencies: [],
      framework: "css",
      setupNotes: [],
      warnings: [],
    },
    {
      code: "gsap.to('.el',{scale:.95})",
      dependencies: ["gsap"],
      framework: "gsap",
      setupNotes: [],
      warnings: [],
    },
    {
      code: "const v={animate:{scale:.95}};",
      dependencies: ["framer-motion"],
      framework: "framer-motion",
      setupNotes: [],
      warnings: [],
    },
  ],
  projectId: "project_123",
  spec: {
    accessibilityNote: "Add prefers-reduced-motion fallback.",
    delayMs: 0,
    description: "The element scales down.",
    durationMs: 400,
    easing: "ease-out",
    element: "button",
    gpuAccelerated: true,
    implementationNotes: [],
    intent: "hover",
    keyframesDetected: 2,
    loops: false,
    performanceScore: 92,
  },
  versionId: "version_123",
};

describe("generated code helpers", () => {
  it("maps every visible tab to a framework and download filename", () => {
    expect(CODE_TABS).toEqual([
      "CSS",
      "GSAP",
      "Framer Motion",
      "React Spring",
    ]);
    expect(getDownloadFilename("CSS")).toBe("animation.css");
    expect(getDownloadFilename("GSAP")).toBe("animation.gsap.js");
    expect(getDownloadFilename("Framer Motion")).toBe("AnimatedComponent.tsx");
    expect(getDownloadFilename("React Spring")).toBe("AnimatedComponent.tsx");
  });

  it("selects code from the matching generated output", () => {
    expect(getGeneratedOutput(result, "GSAP")?.framework).toBe("gsap");
    expect(getCodeContent(result, "Framer Motion")).toContain("animate");
    expect(getCodeContent(result, "React Spring")).toBe("");
  });

  it("prettifies minified snippets without changing empty code", () => {
    expect(prettifyCode("", "CSS")).toBe("");
    expect(prettifyCode(".el{opacity:1;}", "CSS")).toContain(".el {\n");
    expect(prettifyCode("const s={from:{scale:1},to:{scale:.9}};", "React Spring"))
      .toContain("const s={\n");
  });

  it("escapes HTML while highlighting code tokens", () => {
    const html = highlightCode("const tag = '<button>'; // ok");

    expect(html).toContain("&lt;button&gt;");
    expect(html).not.toContain("<button>");
    expect(html).toContain('color: #c084fc');
  });
});
