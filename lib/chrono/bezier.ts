/**
 * Cubic-bézier timing maths for the marketing instruments (hero chronograph,
 * scroll sequence, bench). Pure functions only — no DOM — so they are shared by
 * React components, the WebGL uniforms and the unit tests alike.
 */

export type Bezier = readonly [x1: number, y1: number, x2: number, y2: number];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** One axis of a cubic bézier anchored at 0 and 1. */
function axis(t: number, p1: number, p2: number) {
  const u = 1 - t;
  return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
}

function axisDerivative(t: number, p1: number, p2: number) {
  const u = 1 - t;
  return 3 * u * u * p1 + 6 * u * t * (p2 - p1) + 3 * t * t * (1 - p2);
}

/**
 * Progress (y) at time (x) for a CSS-style cubic-bezier(x1, y1, x2, y2).
 * Newton–Raphson with a bisection fallback, the same strategy browsers use.
 */
export function bezierAt(curve: Bezier, x: number): number {
  const [x1, y1, x2, y2] = curve;
  const tx = clamp01(x);
  if (tx === 0 || tx === 1) return tx;

  let t = tx;
  for (let i = 0; i < 8; i++) {
    const err = axis(t, x1, x2) - tx;
    if (Math.abs(err) < 1e-6) return axis(t, y1, y2);
    const d = axisDerivative(t, x1, x2);
    if (Math.abs(d) < 1e-6) break;
    t -= err / d;
  }

  let lo = 0;
  let hi = 1;
  t = tx;
  for (let i = 0; i < 40; i++) {
    const v = axis(t, x1, x2);
    if (Math.abs(v - tx) < 1e-6) break;
    if (v < tx) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return axis(t, y1, y2);
}

/** Point on the curve at parameter t, in unit space — for drawing it. */
export function bezierPoint(curve: Bezier, t: number): [number, number] {
  const [x1, y1, x2, y2] = curve;
  return [axis(t, x1, x2), axis(t, y1, y2)];
}

/** SVG path for the curve inside a w×h box (y grows downward). */
export function bezierPath(curve: Bezier, w: number, h: number, pad = 0): string {
  const [x1, y1, x2, y2] = curve;
  const X = (v: number) => (pad + v * (w - pad * 2)).toFixed(2);
  const Y = (v: number) => (h - pad - v * (h - pad * 2)).toFixed(2);
  return `M${X(0)},${Y(0)} C${X(x1)},${Y(y1)} ${X(x2)},${Y(y2)} ${X(1)},${Y(1)}`;
}

const trim = (n: number, digits = 2) => {
  const s = n.toFixed(digits);
  return s.replace(/\.?0+$/, "") || "0";
};

export function formatBezier(curve: Bezier): string {
  return `cubic-bezier(${curve.map((v) => trim(v)).join(", ")})`;
}

export type EasingPreset = {
  id: string;
  label: string;
  curve: Bezier;
  /** GSAP's nearest named ease, when one is a faithful match. */
  gsap?: string;
};

export const EASING_PRESETS: EasingPreset[] = [
  { id: "expo-out", label: "Expo out", curve: [0.16, 1, 0.3, 1], gsap: "expo.out" },
  { id: "quint-in-out", label: "Quint in-out", curve: [0.83, 0, 0.17, 1], gsap: "power4.inOut" },
  { id: "back-out", label: "Back out", curve: [0.34, 1.56, 0.64, 1], gsap: "back.out(1.7)" },
  { id: "standard", label: "Standard", curve: [0.2, 0, 0, 1] },
  { id: "snap", label: "Snap", curve: [0.7, 0, 0.84, 0], gsap: "expo.in" },
  { id: "linear", label: "Linear", curve: [0, 0, 1, 1], gsap: "none" },
];

export type MotionSpec = {
  target: string;
  property: "translateY" | "translateX" | "scale" | "opacity";
  from: number;
  to: number;
  durationMs: number;
  curve: Bezier;
  gsapEase?: string;
};

function cssValue(spec: MotionSpec, v: number) {
  switch (spec.property) {
    case "translateX":
    case "translateY":
      return `transform: ${spec.property}(${trim(v, 1)}px)`;
    case "scale":
      return `transform: scale(${trim(v)})`;
    case "opacity":
      return `opacity: ${trim(v)}`;
  }
}

function jsKey(spec: MotionSpec) {
  return spec.property === "translateX" ? "x" : spec.property === "translateY" ? "y" : spec.property;
}

export function toCss(spec: MotionSpec): string {
  const name = "mc-motion";
  return `@keyframes ${name} {
  from { ${cssValue(spec, spec.from)}; }
  to   { ${cssValue(spec, spec.to)}; }
}

${spec.target} {
  animation: ${name} ${spec.durationMs}ms ${formatBezier(spec.curve)} both;
}

@media (prefers-reduced-motion: reduce) {
  ${spec.target} { animation: none; }
}`;
}

export function toGsap(spec: MotionSpec): string {
  const ease = spec.gsapEase ?? `CustomEase.create("mc", "${spec.curve.map((v) => trim(v)).join(",")}")`;
  const header = spec.gsapEase
    ? `import gsap from "gsap";`
    : `import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);`;
  return `${header}

gsap.fromTo("${spec.target}",
  { ${jsKey(spec)}: ${trim(spec.from, 1)} },
  {
    ${jsKey(spec)}: ${trim(spec.to, 1)},
    duration: ${trim(spec.durationMs / 1000, 3)},
    ease: ${spec.gsapEase ? `"${ease}"` : ease},
  },
);`;
}

export function toFramer(spec: MotionSpec): string {
  const key = jsKey(spec);
  return `import { motion } from "framer-motion";

export function Element() {
  return (
    <motion.div
      initial={{ ${key}: ${trim(spec.from, 1)} }}
      animate={{ ${key}: ${trim(spec.to, 1)} }}
      transition={{
        duration: ${trim(spec.durationMs / 1000, 3)},
        ease: [${spec.curve.map((v) => trim(v)).join(", ")}],
      }}
    />
  );
}`;
}

/** Timecode `SS:FF` at 24fps for a 0–1 progress over `totalFrames`. */
export function timecode(progress: number, totalFrames = 72): string {
  const f = Math.round(clamp01(progress) * totalFrames);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(f / 24))}:${pad(f % 24)}`;
}
