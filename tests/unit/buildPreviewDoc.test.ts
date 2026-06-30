import { describe, expect, it } from "vitest";

import { buildPreviewDoc } from "@/lib/preview/buildPreviewDoc";
import type { PreviewInput } from "@/lib/preview/types";

const baseSpec: PreviewInput["spec"] = {
  durationMs: 600,
  delayMs: 0,
  easing: "ease-out",
  loops: false,
  element: ".card",
  intent: "entrance",
};

function input(partial: Partial<PreviewInput>): PreviewInput {
  return { framework: "css", code: "", spec: baseSpec, runId: 1, ...partial };
}

describe("buildPreviewDoc", () => {
  it("embeds the console bridge with the run id and a target element", () => {
    const doc = buildPreviewDoc(input({ runId: 42 }));
    expect(doc).toContain("<!doctype html>");
    expect(doc).toContain("motioncode-preview");
    expect(doc).toContain("var RUN_ID = 42");
    expect(doc).toContain('id="target"');
    expect(doc).toContain("window.__previewReady");
  });

  it("injects CSS as a JS string literal that cannot break out of the script tag", () => {
    const malicious = "/* </script><script>window.__pwned=1</script> */ .x{}";
    const doc = buildPreviewDoc(input({ framework: "css", code: malicious }));
    // The raw closing tag must be escaped so the parser never sees a real </script>.
    expect(doc).not.toContain("</script><script>window.__pwned");
    expect(doc).toContain("\\u003c/script>");
  });

  it("loads the vendored gsap bundle for the gsap framework", () => {
    const doc = buildPreviewDoc(
      input({ framework: "gsap", code: "gsap.to(target, { x: 100 });" }),
    );
    expect(doc).toContain("/vendor/gsap.min.js");
    expect(doc).toContain('new Function("gsap", "target"');
  });

  it("loads React + Babel for component frameworks and strips module syntax", () => {
    const code =
      'import { motion } from "framer-motion";\nexport function AnimatedComponent() { return <motion.div />; }';
    const doc = buildPreviewDoc(input({ framework: "framer-motion", code }));
    expect(doc).toContain("react.production.min.js");
    expect(doc).toContain("@babel/standalone");
    expect(doc).toContain("framer-motion");
    // import line is stripped before being embedded
    expect(doc).not.toContain('import { motion } from \\"framer-motion\\"');
    // component name is detected for mounting
    expect(doc).toContain('"AnimatedComponent"');
  });

  it("derives a spec-driven fallback animation keyed to the intent", () => {
    const exitDoc = buildPreviewDoc(input({ framework: "css", code: ".x{}", spec: { ...baseSpec, intent: "exit" } }));
    expect(exitDoc).toContain("mcFallback");
    expect(exitDoc).toContain("translateY(18px)");
  });
});
