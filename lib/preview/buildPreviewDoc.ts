import { consoleBridgeScript } from "./consoleBridge";
import type { PreviewInput } from "./types";

/** Safely embed an arbitrary string inside a <script> as a JS string literal. */
function jsString(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

const REACT_UMD = "https://unpkg.com/react@18/umd/react.production.min.js";
const REACT_DOM_UMD = "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js";
const BABEL_UMD = "https://unpkg.com/@babel/standalone@7/babel.min.js";
const FRAMER_UMD = "https://unpkg.com/framer-motion@11/dist/framer-motion.js";
const SPRING_UMD = "https://unpkg.com/@react-spring/web@9/dist/react-spring_web.umd.js";

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
    display: grid;
    place-items: center;
    min-height: 100%;
    background:
      radial-gradient(circle at 50% 0%, rgba(0,255,136,0.05), transparent 60%),
      #11120D;
    color: #FFFBF4;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    overflow: hidden;
  }
  #stage {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    padding: 32px;
  }
  #root { display: grid; place-items: center; }
  /* The default demo element. Carries several aliases so generated selectors
     (.element, .box, #target, .target) all resolve to it. */
  #target.element.box.target {
    width: 132px;
    height: 132px;
    display: grid;
    place-items: center;
    border-radius: 14px;
    background: linear-gradient(135deg, #D8CFBC, rgba(216,207,188,0.55));
    color: #11120D;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    box-shadow: 0 24px 60px rgba(0,0,0,0.45);
  }
</style>`;
}

/** Spec-driven keyframes so a preview ALWAYS shows motion, even without runnable code. */
function specFallbackScript(input: PreviewInput): string {
  const { durationMs, delayMs, easing, loops, intent } = input.spec;
  const iteration = loops ? "infinite" : "1";
  const i = (intent || "").toLowerCase();
  let frames: string;
  if (i === "exit") {
    frames = "from { opacity:1; transform: translateY(0) scale(1); } to { opacity:0; transform: translateY(18px) scale(0.92); }";
  } else if (i === "hover") {
    frames = "0%,100% { transform: scale(1); } 50% { transform: scale(1.08); }";
  } else if (i === "loop" || i === "loading") {
    frames = "from { transform: rotate(0deg); } to { transform: rotate(360deg); }";
  } else if (i === "morph") {
    frames = "0% { border-radius: 14px; } 50% { border-radius: 50%; transform: rotate(45deg); } 100% { border-radius: 14px; }";
  } else {
    // entrance / scroll / unknown
    frames = "from { opacity:0; transform: translateY(18px) scale(0.96); } to { opacity:1; transform: translateY(0) scale(1); }";
  }
  const css = `
@keyframes mcFallback { ${frames} }
#target { animation: mcFallback ${Math.max(120, durationMs)}ms ${easing || "ease"} ${delayMs || 0}ms ${iteration} both; }
`;
  return `
(function () {
  var s = document.createElement("style");
  s.textContent = ${jsString(css)};
  document.head.appendChild(s);
})();`;
}

function targetEl(): string {
  return `<div id="target" class="element box target">EL</div>`;
}

function cssBody(input: PreviewInput): string {
  // Inject the generated CSS. Then, if the target has no animation bound by the
  // generated rules, fall back to the spec-driven keyframes so it still plays.
  return `
<div id="stage">${targetEl()}</div>
<script>
(function () {
  try {
    var style = document.createElement("style");
    style.textContent = ${jsString(input.code)};
    document.head.appendChild(style);
  } catch (e) { console.error(e); }

  var target = document.getElementById("target");
  var bound = false;
  try {
    var anim = getComputedStyle(target).animationName;
    bound = anim && anim !== "none";
  } catch (e) {}
  if (!bound) { ${specFallbackScript(input)} }
  window.__previewReady();
})();
</script>`;
}

function gsapBody(input: PreviewInput): string {
  return `
<div id="stage">${targetEl()}</div>
<script src="${"/vendor/gsap.min.js"}"></script>
<script>
(function () {
  var target = document.getElementById("target");
  if (typeof gsap === "undefined") {
    console.error("GSAP failed to load.");
    ${specFallbackScript(input)}
    window.__previewReady();
    return;
  }
  try {
    var fn = new Function("gsap", "target", ${jsString(input.code)});
    fn(gsap, target);
  } catch (e) {
    console.error(e);
    ${specFallbackScript(input)}
  }
  window.__previewReady();
})();
</script>`;
}

/** Strip ES import/export lines that won't run against UMD globals. */
function stripModuleSyntax(code: string): string {
  return code
    .replace(/^\s*import[^\n;]*;?\s*$/gm, "")
    .replace(/export\s+default\s+/g, "")
    .replace(/export\s+(?=(function|const|let|var|class)\b)/g, "");
}

/** Best guess at the exported component identifier. */
function guessComponentName(code: string): string | null {
  const fn = code.match(/function\s+([A-Z][A-Za-z0-9_]*)\s*\(/);
  if (fn) return fn[1];
  const cst = code.match(/(?:const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*=/);
  if (cst) return cst[1];
  return null;
}

function reactBody(input: PreviewInput, libUrl: string, globalSetup: string): string {
  const stripped = stripModuleSyntax(input.code);
  const componentName = guessComponentName(stripped);
  return `
<div id="stage"><div id="root">${targetEl()}</div></div>
<script src="${REACT_UMD}"></script>
<script src="${REACT_DOM_UMD}"></script>
<script src="${libUrl}"></script>
<script src="${BABEL_UMD}"></script>
<script>
(function () {
  function fallback(msg) {
    if (msg) console.warn(msg);
    ${specFallbackScript(input)}
    window.__previewReady();
  }
  try {
    if (typeof React === "undefined" || typeof ReactDOM === "undefined" || typeof Babel === "undefined") {
      return fallback("Preview libraries unavailable (offline?). Showing spec-based preview.");
    }
    ${globalSetup}
    var name = ${JSON.stringify(componentName)};
    if (!name) return fallback("Could not detect an exported component. Showing spec-based preview.");
    var src = ${jsString(stripped)} + "\\n;return (typeof " + name + " !== 'undefined') ? " + name + " : null;";
    var transpiled = Babel.transform(src, { presets: ["react", ["typescript", { allExtensions: true, isTSX: true }]] }).code;
    var Component = new Function("React", "motion", "useState", "useEffect", "useRef", "animated", "useSpring", transpiled)(
      React, window.__motion, React.useState, React.useEffect, React.useRef, window.__animated, window.__useSpring
    );
    if (!Component) return fallback("Component evaluated to null. Showing spec-based preview.");
    var mount = document.getElementById("root");
    mount.innerHTML = "";
    ReactDOM.createRoot(mount).render(React.createElement(Component));
    window.__previewReady();
  } catch (e) {
    console.error(e);
    fallback();
  }
})();
</script>`;
}

function framerBody(input: PreviewInput): string {
  const setup = `
    window.__motion = (window.Motion && window.Motion.motion) || (window.FramerMotion && window.FramerMotion.motion);
    if (!window.__motion) return fallback("framer-motion global not found. Showing spec-based preview.");`;
  return reactBody(input, FRAMER_UMD, setup);
}

function springBody(input: PreviewInput): string {
  const setup = `
    var spring = window.ReactSpring || window.reactSpringWeb || window["@react-spring/web"];
    window.__animated = spring && spring.animated;
    window.__useSpring = spring && spring.useSpring;
    if (!window.__animated) return fallback("react-spring global not found. Showing spec-based preview.");`;
  return reactBody(input, SPRING_UMD, setup);
}

/**
 * Compose the full srcDoc for the preview iframe. Rebuilt on every Run so each
 * execution starts from clean state.
 */
export function buildPreviewDoc(input: PreviewInput): string {
  let body: string;
  switch (input.framework) {
    case "css":
      body = cssBody(input);
      break;
    case "gsap":
      body = gsapBody(input);
      break;
    case "framer-motion":
      body = framerBody(input);
      break;
    case "react-spring":
      body = springBody(input);
      break;
    default:
      body = cssBody(input);
  }

  return `<!doctype html>
<html lang="en">
<head>
<script>${consoleBridgeScript(input.runId)}</script>
${harnessHead()}
</head>
<body>
${body}
</body>
</html>`;
}
