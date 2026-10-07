import { consoleBridgeScript } from "./consoleBridge";
import { PREVIEW_RUNTIME } from "./runtime";
import type { PreviewInput } from "./types";

/** Safely embed an arbitrary value inside a <script> as a JS literal. */
function jsLiteral(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Self-hosted libraries (see scripts/build-preview-vendor.mjs). The srcdoc
 * iframe inherits the app's CSP (`script-src 'self'`), so CDN scripts would be
 * blocked; everything the preview needs is served from /vendor.
 */
export const PREVIEW_VENDOR = {
  gsap: "/vendor/gsap.min.js",
  react: "/vendor/react.production.min.js",
  reactDom: "/vendor/react-dom.production.min.js",
  framerMotion: "/vendor/framer-motion.js",
  reactSpring: "/vendor/react-spring-web.js",
  sucrase: "/vendor/sucrase.js",
} as const;

function vendorScripts(framework: PreviewInput["framework"]): string[] {
  switch (framework) {
    case "gsap":
      return [PREVIEW_VENDOR.gsap, PREVIEW_VENDOR.sucrase];
    case "framer-motion":
      return [
        PREVIEW_VENDOR.react,
        PREVIEW_VENDOR.reactDom,
        PREVIEW_VENDOR.framerMotion,
        PREVIEW_VENDOR.sucrase,
      ];
    case "react-spring":
      return [
        PREVIEW_VENDOR.react,
        PREVIEW_VENDOR.reactDom,
        PREVIEW_VENDOR.reactSpring,
        PREVIEW_VENDOR.sucrase,
      ];
    default:
      return [];
  }
}

/** Base harness: brand-matched stage + a demo target the animation can hook onto. */
function harnessHead(): string {
  return `
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body {
    min-height: 100%;
    background:
      radial-gradient(circle at 50% 0%, rgba(0, 153, 255, 0.05), transparent 60%),
      #0a0b0d;
    color: #f7f8f8;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    overflow: hidden;
  }
  /* :where() keeps harness rules at zero specificity so generated CSS wins. */
  :where(#stage) {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    padding: 32px;
  }
  :where(#root) { display: grid; place-items: center; }
  :where([data-mc-target]) {
    width: 132px;
    height: 132px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: linear-gradient(135deg, #a6a6a6, rgba(255,255,255,0.55));
    color: #0a0b0d;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    box-shadow: 0 24px 60px rgba(0,0,0,0.45);
  }
  /* A component that renders an empty element still gets a visible box. */
  :where(#root > :empty:not([data-mc-target])) {
    width: 132px;
    height: 132px;
    border-radius: 14px;
    background: linear-gradient(135deg, #a6a6a6, rgba(255,255,255,0.55));
  }
</style>`;
}

/** Spec-driven keyframes so a preview ALWAYS shows motion, even without runnable code. */
export function specFallbackCss(spec: PreviewInput["spec"]): string {
  const { durationMs, delayMs, easing, loops, intent } = spec;
  const iteration = loops ? "infinite" : "1";
  const i = (intent || "").toLowerCase();
  let frames: string;
  if (i === "exit") {
    frames =
      "from { opacity:1; transform: translateY(0) scale(1); } to { opacity:0; transform: translateY(18px) scale(0.92); }";
  } else if (i === "hover") {
    frames = "0%,100% { transform: scale(1); } 50% { transform: scale(1.08); }";
  } else if (i === "loop" || i === "loading") {
    frames = "from { transform: rotate(0deg); } to { transform: rotate(360deg); }";
  } else if (i === "morph") {
    frames =
      "0% { border-radius: 14px; } 50% { border-radius: 50%; transform: rotate(45deg); } 100% { border-radius: 14px; }";
  } else {
    // entrance / scroll / unknown
    frames =
      "from { opacity:0; transform: translateY(18px) scale(0.96); } to { opacity:1; transform: translateY(0) scale(1); }";
  }
  // Easing comes from user-editable spec text; keep it to characters a CSS
  // timing function can contain so it can't escape the declaration.
  const safeEasing = /^[\w\s(),.-]+$/.test(easing || "") ? easing : "ease";
  return `
@keyframes mcFallback { ${frames} }
.mc-fallback[data-mc-target] { animation: mcFallback ${Math.max(120, durationMs || 0)}ms ${safeEasing} ${Math.max(0, delayMs || 0)}ms ${iteration} both !important; }
`;
}

/**
 * Compose the full srcDoc for the preview iframe. Rebuilt on every Run so each
 * execution starts from clean state.
 */
export function buildPreviewDoc(input: PreviewInput): string {
  const config = {
    framework: input.framework,
    intent: (input.spec.intent || "").toLowerCase(),
    durationMs: input.spec.durationMs,
    delayMs: input.spec.delayMs,
    easing: input.spec.easing,
    loops: input.spec.loops,
  };
  const scripts = vendorScripts(input.framework)
    .map((src) => `<script src="${src}"></script>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<script>${consoleBridgeScript(input.runId)}</script>
${harnessHead()}
<style>${specFallbackCss(input.spec)}</style>
</head>
<body>
<div id="stage"><div id="root"><div id="target" class="element box target" data-mc-target>EL</div></div></div>
${scripts}
<script>
window.__MC_CONFIG = ${jsLiteral(config)};
window.__MC_CODE = ${jsLiteral(input.code)};
</script>
<script>${PREVIEW_RUNTIME}</script>
</body>
</html>`;
}
