import { describe, expect, it } from "vitest";

import {
  buildPreviewDoc,
  PREVIEW_VENDOR,
  specFallbackCss,
} from "@/lib/preview/buildPreviewDoc";
import { isPreviewMessage, type PreviewInput } from "@/lib/preview/types";

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
    expect(doc).toContain("data-mc-target");
    expect(doc).toContain("window.__previewReady");
  });

  it("injects CSS as a JS string literal that cannot break out of the script tag", () => {
    const malicious = "/* </script><script>window.__pwned=1</script> */ .x{}";
    const doc = buildPreviewDoc(input({ framework: "css", code: malicious }));
    // The raw closing tag must be escaped so the parser never sees a real </script>.
    expect(doc).not.toContain("</script><script>window.__pwned");
    expect(doc).toContain("\\u003c/script>");
  });

  it("reports which mode played so the UI can flag spec fallbacks", () => {
    const doc = buildPreviewDoc(input({}));
    expect(doc).toContain('mode: mode === "fallback" ? "fallback" : "code"');
  });

  it("serves every preview library from /vendor so the app CSP allows it", () => {
    for (const framework of ["css", "gsap", "framer-motion", "react-spring"] as const) {
      const doc = buildPreviewDoc(input({ framework, code: "x" }));
      // srcdoc iframes inherit `script-src 'self'`: no CDN scripts.
      expect(doc).not.toMatch(/<script[^>]+src="https?:/);
    }
  });

  it("loads gsap + the transpiler for the gsap framework", () => {
    const doc = buildPreviewDoc(
      input({ framework: "gsap", code: "gsap.to(target, { x: 100 });" }),
    );
    expect(doc).toContain(`src="${PREVIEW_VENDOR.gsap}"`);
    expect(doc).toContain(`src="${PREVIEW_VENDOR.sucrase}"`);
    expect(doc).toContain('"framework":"gsap"');
  });

  it("loads React and the framework runtime for component frameworks", () => {
    const code =
      'import { motion } from "framer-motion";\nexport function AnimatedComponent() { return <motion.div />; }';
    const framer = buildPreviewDoc(input({ framework: "framer-motion", code }));
    expect(framer).toContain(`src="${PREVIEW_VENDOR.react}"`);
    expect(framer).toContain(`src="${PREVIEW_VENDOR.reactDom}"`);
    expect(framer).toContain(`src="${PREVIEW_VENDOR.framerMotion}"`);
    // The code is embedded verbatim (as an escaped literal) for the runtime to transpile.
    expect(framer).toContain('import { motion } from \\"framer-motion\\"');

    const spring = buildPreviewDoc(input({ framework: "react-spring", code }));
    expect(spring).toContain(`src="${PREVIEW_VENDOR.reactSpring}"`);
    expect(spring).not.toContain(PREVIEW_VENDOR.framerMotion);
  });

  it("keeps generated code from breaking out of the runtime script", () => {
    const doc = buildPreviewDoc(
      input({ framework: "gsap", code: "</script><script>window.__pwned=1</script>\u2028" }),
    );
    expect(doc).not.toContain("</script><script>window.__pwned");
    expect(doc).not.toContain("\u2028");
  });

  it("sanitizes a hostile easing before writing it into fallback CSS", () => {
    const css = specFallbackCss({ ...baseSpec, easing: "ease; } body { display:none" });
    expect(css).not.toContain("display:none");
    expect(css).toContain(" ease ");
  });

  it("derives a spec-driven fallback animation keyed to the intent", () => {
    const exitDoc = buildPreviewDoc(input({ framework: "css", code: ".x{}", spec: { ...baseSpec, intent: "exit" } }));
    expect(exitDoc).toContain("mcFallback");
    expect(exitDoc).toContain(".mc-fallback[data-mc-target]");
    expect(exitDoc).toContain("translateY(18px)");
  });
});

describe("isPreviewMessage", () => {
  const base = { source: "motioncode-preview", type: "ready", runId: 1 };

  it("accepts ready messages with or without a known mode", () => {
    expect(isPreviewMessage(base)).toBe(true);
    expect(isPreviewMessage({ ...base, mode: "code" })).toBe(true);
    expect(isPreviewMessage({ ...base, mode: "fallback" })).toBe(true);
  });

  it("rejects unknown modes and foreign sources", () => {
    expect(isPreviewMessage({ ...base, mode: "other" })).toBe(false);
    expect(isPreviewMessage({ ...base, source: "someone-else" })).toBe(false);
  });
});
