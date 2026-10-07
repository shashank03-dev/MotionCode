import { expect, type Page, test } from "@playwright/test";

import { buildPreviewDoc } from "../../lib/preview/buildPreviewDoc";
import type { PreviewInput } from "../../lib/preview/types";

/**
 * Runs generated-code samples through the real Studio preview harness: a
 * sandboxed srcdoc iframe under the app's own CSP, loading the self-hosted
 * /vendor runtime from the app server. Each sample must report whether the
 * code itself played ("code") or the spec-based fallback stood in.
 */

type Sample = {
  name: string;
  framework: PreviewInput["framework"];
  code: string;
  expected: "code" | "fallback";
  intent?: string;
};

const SAMPLES: Sample[] = [
  {
    name: "CSS keyframes bound to an arbitrary class",
    framework: "css",
    expected: "code",
    code: [
      ".card { animation: fadeUp 600ms cubic-bezier(0.4, 0, 0.2, 1) both; }",
      "@keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }",
      "@media (prefers-reduced-motion: reduce) { .card { animation: none; } }",
    ].join("\n"),
  },
  {
    name: "CSS hover transition",
    framework: "css",
    expected: "code",
    intent: "hover",
    code: ".button { transition: transform 300ms ease; }\n.button:hover { transform: scale(1.1); }",
  },
  {
    name: "CSS state-class transition",
    framework: "css",
    expected: "code",
    code: ".modal { opacity: 0; transition: opacity .4s; }\n.modal.is-open { opacity: 1; }",
  },
  {
    name: "CSS that targets nothing the preview can match",
    framework: "css",
    expected: "fallback",
    code: "button { color: red; }",
  },
  {
    name: "GSAP TypeScript module with a selector",
    framework: "gsap",
    expected: "code",
    code: [
      'import gsap from "gsap";',
      'const el: HTMLElement | null = document.querySelector(".hero-title");',
      'gsap.from(el, { y: 40, opacity: 0, duration: 0.6, ease: "power2.out" });',
    ].join("\n"),
  },
  {
    name: "GSAP exported helper",
    framework: "gsap",
    expected: "code",
    code: [
      'import gsap from "gsap";',
      "export function animateTarget(target: gsap.TweenTarget) {",
      "  return gsap.to(target, { duration: 0.3, rotation: 90 });",
      "}",
    ].join("\n"),
  },
  {
    name: "GSAP syntax error",
    framework: "gsap",
    expected: "fallback",
    code: "gsap.to(target, { x: 100 ",
  },
  {
    name: "Framer Motion default-exported component",
    framework: "framer-motion",
    expected: "code",
    code: [
      'import { motion } from "framer-motion";',
      "export default function AnimatedCard({ children }: { children?: React.ReactNode }) {",
      "  return <motion.div className=\"card\" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>{children}</motion.div>;",
      "}",
    ].join("\n"),
  },
  {
    name: "Framer Motion variants object",
    framework: "framer-motion",
    expected: "code",
    code: "export const variants = {\n  hidden: { opacity: 0 },\n  visible: { opacity: 1 },\n};",
  },
  {
    name: "Framer Motion component that throws",
    framework: "framer-motion",
    expected: "fallback",
    code: "export default function Boom() { throw new Error('nope'); }",
  },
  {
    name: "React Spring component",
    framework: "react-spring",
    expected: "code",
    code: [
      'import { useSpring, animated } from "@react-spring/web";',
      "export function AnimatedComponent() {",
      "  const styles = useSpring({ from: { opacity: 0 }, to: { opacity: 1 } });",
      "  return <animated.div style={styles}>Hi</animated.div>;",
      "}",
    ].join("\n"),
  },
  {
    name: "React Spring exported hook",
    framework: "react-spring",
    expected: "code",
    code: [
      'import { useSpring } from "@react-spring/web";',
      "export function useFadeSpring() {",
      "  return useSpring({ from: { opacity: 0 }, to: { opacity: 1 } });",
      "}",
    ].join("\n"),
  },
];

/**
 * Mount the preview iframe inside a real app page so it inherits the CSP the
 * server actually sends (and a real network address space; a route-fulfilled
 * document would trip Chromium's local-network checks on /vendor loads).
 */
async function openHarness(page: Page) {
  await page.goto("/terms");
  await page.evaluate(() => {
    const frame = document.createElement("iframe");
    frame.id = "preview-harness-frame";
    frame.setAttribute("sandbox", "allow-scripts");
    // Parked below the fold on purpose: Chromium pauses rAF in offscreen
    // cross-origin frames, and readiness must not depend on it (the Studio
    // preview is often scrolled away or behind the mobile Code tab).
    frame.style.cssText = "position:absolute;top:4000px;width:600px;height:400px;border:0";
    document.body.appendChild(frame);
  });
}

test.describe("studio preview runtime", () => {
  test("runs generated code for every framework under the app CSP", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "Runtime behavior is viewport-independent; run once.",
    );
    await openHarness(page);

    for (const [index, sample] of SAMPLES.entries()) {
      const runId = index + 1;
      const doc = buildPreviewDoc({
        code: sample.code,
        framework: sample.framework,
        runId,
        spec: {
          delayMs: 0,
          durationMs: 600,
          easing: "ease-out",
          element: "card",
          intent: sample.intent ?? "entrance",
          loops: false,
        },
      });

      const ready = await page.evaluate(
        ({ doc, runId }) =>
          new Promise<{ mode?: string; logs: string[] } | null>((resolve) => {
            const logs: string[] = [];
            const timer = window.setTimeout(() => resolve(null), 8000);
            window.addEventListener("message", function onMessage(event) {
              const data = event.data;
              if (data?.source !== "motioncode-preview" || data.runId !== runId) return;
              if (data.type !== "ready") {
                logs.push(`${data.level ?? data.type}: ${data.text}`);
                return;
              }
              window.clearTimeout(timer);
              window.removeEventListener("message", onMessage);
              resolve({ mode: data.mode, logs });
            });
            (document.getElementById("preview-harness-frame") as HTMLIFrameElement).srcdoc = doc;
          }),
        { doc, runId },
      );

      expect(ready, `${sample.name}: preview never reported ready`).not.toBeNull();
      expect(ready?.mode, `${sample.name}\n${ready?.logs.join("\n")}`).toBe(sample.expected);
    }
  });
});
