import { describe, expect, it } from "vitest";

import type { AnalysisResult } from "@/lib/contracts/motion";
import {
  createCssExport,
  createExportBundle,
  createFramerMotionExport,
  createGsapExport,
  createMarkdownImplementationBrief,
  createReactSpringExport,
} from "@/lib/exporters";

const analysis: AnalysisResult = {
  assetId: "asset_123",
  createdAt: "2026-06-06T10:00:00.000Z",
  frameCount: 4,
  id: "analysis_123",
  model: "gemini-2.5-pro",
  outputs: [
    {
      code: ".card { transition: transform 420ms ease; }",
      dependencies: [],
      framework: "css",
      setupNotes: ["Add the class to the animated element."],
      warnings: ["Avoid animating layout properties."],
    },
    {
      code: "gsap.to('.card', { y: 24, duration: 0.42 })",
      dependencies: ["gsap"],
      framework: "gsap",
      setupNotes: ["Register plugins before timeline creation."],
      warnings: [],
    },
    {
      code: "export const card = { animate: { y: 24 } }",
      dependencies: ["framer-motion"],
      framework: "framer-motion",
      setupNotes: ["Wrap the target with motion.div."],
      warnings: [],
    },
    {
      code: "useSpring({ y: 24 })",
      dependencies: ["@react-spring/web"],
      framework: "react-spring",
      setupNotes: ["Render animated.div from @react-spring/web."],
      warnings: [],
    },
  ],
  projectId: "project_123",
  spec: {
    accessibilityNote: "Respect prefers-reduced-motion.",
    delayMs: 80,
    description: "The card lifts into place.",
    durationMs: 420,
    easing: "ease-out",
    element: "card",
    gpuAccelerated: true,
    implementationNotes: ["Use transform and opacity only."],
    intent: "entrance",
    keyframesDetected: 3,
    loops: false,
    performanceScore: 95,
  },
  versionId: "version_123",
};

describe("exporters", () => {
  it("creates a markdown implementation brief with framework snippets and notes", () => {
    const brief = createMarkdownImplementationBrief(analysis, {
      projectTitle: "Launch card",
      versionLabel: "handoff",
      versionNumber: 3,
    });

    expect(brief.filename).toBe("launch-card-implementation-brief.md");
    expect(brief.language).toBe("markdown");
    expect(brief.code).toContain("# Launch card Implementation Brief");
    expect(brief.code).toContain("Version: 3 - handoff");
    expect(brief.code).toContain("Duration: 420ms");
    expect(brief.code).toContain("Delay: 80ms");
    expect(brief.code).toContain("`gsap`");
    expect(brief.code).toContain("`framer-motion`");
    expect(brief.code).toContain("Respect prefers-reduced-motion.");
    expect(brief.code).toContain("```css");
    expect(brief.code).toContain("```tsx");
    expect(brief.code).toContain(".card { transition");
    expect(brief.code).toContain("useSpring({ y: 24 })");
  });

  it("creates framework helper exports with dependencies, setup, accessibility, and warnings", () => {
    expect(createCssExport(analysis)).toMatchObject({
      dependencies: [],
      filename: "motioncode-css-helper.css",
      framework: "css",
      language: "css",
      setupNotes: expect.arrayContaining([
        "Add the class to the animated element.",
      ]),
      warnings: expect.arrayContaining(["Avoid animating layout properties."]),
    });

    expect(createGsapExport(analysis)).toMatchObject({
      dependencies: ["gsap"],
      filename: "motioncode-gsap-helper.ts",
      framework: "gsap",
      language: "ts",
      setupNotes: expect.arrayContaining([
        "Install with: npm install gsap",
      ]),
    });

    expect(createFramerMotionExport(analysis)).toMatchObject({
      dependencies: ["framer-motion"],
      filename: "motioncode-framer-motion-helper.tsx",
      framework: "framer-motion",
      language: "tsx",
      setupNotes: expect.arrayContaining([
        "Install with: npm install framer-motion",
      ]),
    });

    expect(createReactSpringExport(analysis)).toMatchObject({
      dependencies: ["@react-spring/web"],
      filename: "motioncode-react-spring-helper.tsx",
      framework: "react-spring",
      language: "tsx",
      setupNotes: expect.arrayContaining([
        "Install with: npm install @react-spring/web",
      ]),
    });

    const gsap = createGsapExport(analysis);
    expect(gsap.accessibilityNotes).toContain("Respect prefers-reduced-motion.");
    expect(gsap.accessibilityNotes).toContain(
      "Disable or reduce the animation when prefers-reduced-motion is enabled.",
    );
  });

  it("creates a complete export bundle in a stable order", () => {
    const bundle = createExportBundle(analysis, { projectTitle: "Launch card" });

    expect(bundle.map((item) => item.framework)).toEqual([
      "markdown",
      "css",
      "gsap",
      "framer-motion",
      "react-spring",
    ]);
  });
});
