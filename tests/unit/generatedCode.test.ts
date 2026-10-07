import { describe, expect, it } from "vitest";

import type { AnalysisResult } from "@/lib/contracts/motion";
import {
  CODE_TABS,
  getCodeContent,
  getDownloadFilename,
  getGeneratedOutput,
  highlightCode,
  prettifyCode,
  type CodeTab,
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

  it("formats without touching strings, comments, regexes or template literals", () => {
    const cases: Array<[string, CodeTab]> = [
      [
        ".el{transform:scale(.95);opacity:.5}@keyframes a{from{opacity:0}to{opacity:1}}@media (prefers-reduced-motion: reduce){.el{animation:none}}",
        "CSS",
      ],
      ['.el{background:url("data:image/png;base64,abc");transition:all .3s cubic-bezier(0.4, 0, 0.2, 1)}', "CSS"],
      [
        "import gsap from 'gsap';gsap.to('.el',{scale:.95,ease:\"cubic-bezier(0.4, 0, 0.2, 1)\"});for(let i=0;i<3;i++){console.log(`a;{${i}}`)}",
        "GSAP",
      ],
      ["const s={from:{scale:1},to:{scale:.9}};const r=/;{/g;", "React Spring"],
      ["const t = `line1\n    keep;{ indent }\n`; // c;{\n/* a;{\n   b */ x();", "GSAP"],
    ];

    for (const [code, tab] of cases) {
      const once = prettifyCode(code, tab);
      // Idempotent, and only whitespace changes.
      expect(prettifyCode(once, tab)).toBe(once);
      expect(once.replace(/\s+/g, "")).toBe(code.replace(/\s+/g, ""));
      if (tab !== "CSS") {
        expect(() => new Function(once.replace(/^import[^;]*;/gm, ""))).not.toThrow();
      }
    }

    // Template literal contents keep their exact indentation.
    expect(prettifyCode("const t = `a\n    keep;\n`;", "GSAP")).toContain("\n    keep;\n");
  });

  it("only re-indents hand-structured JSX instead of re-breaking it", () => {
    const code = [
      'import { motion } from "framer-motion";',
      "export default function Card({ children }) {",
      "return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{children}</motion.div>;",
      "}",
    ].join("\n");
    expect(prettifyCode(code, "Framer Motion")).toBe(
      [
        'import { motion } from "framer-motion";',
        "export default function Card({ children }) {",
        "  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{children}</motion.div>;",
        "}",
      ].join("\n"),
    );
  });

  it("escapes HTML while highlighting code tokens", () => {
    const html = highlightCode("const tag = '<button>'; // ok");

    expect(html).toContain("&lt;button&gt;");
    expect(html).not.toContain("<button>");
    expect(html).toContain('color: #c084fc');
  });
});
