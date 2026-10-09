"use client";

import * as React from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

import {
  EASING_PRESETS,
  bezierAt,
  bezierPath,
  formatBezier,
  type Bezier,
} from "@/lib/chrono/bezier";
import { useHydratedReducedMotion } from "@/lib/hooks/use-hydrated-reduced-motion";
import { canUseWebGL } from "@/lib/webgl";
import { cn } from "@/lib/utils";

/**
 * The Chronograph — the hero's photographic plate.
 *
 * A single UI element is exposed N times at a fixed shutter interval while it
 * travels along its path, exactly like Marey's geometric chronophotographs:
 * where the exposures bunch up the motion is slow, where they spread it is
 * fast. The spacing *is* the easing curve. Move the pointer and you bend the
 * curve's handles — the plate re-exposes live and the readout prints the real
 * `cubic-bezier()` you just made. Idle, it cycles through house presets.
 *
 * Rendering: one full-screen fragment shader (ogl), exposures and path
 * computed on the CPU each frame and sent as uniforms. Paused off-screen and
 * in hidden tabs. Reduced motion or no WebGL → a static SVG plate.
 */

const MAX_EXPOSURES = 18;
const PATH_SEGMENTS = 40;
const CYCLE_MS = 3800;

const VERT = /* glsl */ `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform float uTime;
uniform float uBox;
uniform float uPathAlpha;
uniform vec4 uPts[${MAX_EXPOSURES}];
uniform vec2 uPath[${PATH_SEGMENTS + 1}];
uniform vec3 uHead;
uniform vec3 uAccent;
uniform vec3 uBone;
uniform vec3 uCarbon;

float sdBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0);
  return length(pa - ba * h);
}
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  vec3 col = uCarbon;

  // Safelight bloom trailing the moving head.
  float dHead = length(p - uHead.xy);
  col += uAccent * exp(-dHead / (uBox * 2.6)) * 0.22 * uHead.z;

  // The travel path — a hairline the exposures sit on.
  float dPath = 1e5;
  for (int i = 0; i < ${PATH_SEGMENTS}; i++) {
    dPath = min(dPath, sdSeg(p, uPath[i], uPath[i + 1]));
  }
  col = mix(col, uBone, (1.0 - smoothstep(0.0, 1.0, dPath - 0.3)) * 0.16 * uPathAlpha);

  for (int i = 0; i < ${MAX_EXPOSURES}; i++) {
    vec4 e = uPts[i];
    if (e.z < 0.002) continue;
    vec2 q = p - e.xy;

    // Motion smear between consecutive exposures — the long-exposure blur.
    if (i < ${MAX_EXPOSURES - 1}) {
      vec4 n = uPts[i + 1];
      if (n.z > 0.002) {
        float s = sdSeg(p, e.xy, n.xy);
        col += uBone * (1.0 - smoothstep(0.0, uBox * 0.42, s)) * 0.03 * min(e.z, n.z);
      }
    }

    float d = sdBox(q, vec2(uBox * 0.5), uBox * 0.24);
    float stroke = 1.0 - smoothstep(0.0, 1.0, abs(d) - 0.45);
    float fill = 1.0 - smoothstep(-0.6, 0.6, d);
    if (e.w > 0.5) {
      col = mix(col, uAccent, fill * e.z);
    } else {
      col = mix(col, uBone, (stroke * 0.6 + fill * 0.03) * e.z);
    }
    // Marey's joint marker: a dot at every sample.
    float dotMask = 1.0 - smoothstep(1.1, 2.1, length(q));
    col = mix(col, e.w > 0.5 ? uCarbon : uBone, dotMask * e.z * 0.85);
  }

  // Film grain + gentle vignette.
  float g = hash(floor(p * uDpr) + floor(uTime * 24.0)) - 0.5;
  col += g * 0.03;
  vec2 uv = p / uRes;
  col *= mix(0.72, 1.0, smoothstep(1.3, 0.3, length((uv - vec2(0.62, 0.5)) * vec2(1.1, 1.3))));

  gl_FragColor = vec4(col, 1.0);
}
`;

type Layout = {
  w: number;
  h: number;
  box: number;
  count: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  arc: number;
};

function layoutFor(w: number, h: number): Layout {
  const wide = w >= 1024;
  if (wide) {
    return {
      w,
      h,
      box: Math.min(64, w * 0.04),
      count: 16,
      x0: w * 0.48,
      x1: w * 0.9,
      y0: h * 0.27,
      y1: h * 0.74,
      arc: h * 0.12,
    };
  }
  return {
    w,
    h,
    box: Math.max(26, Math.min(40, w * 0.08)),
    count: 12,
    x0: w * 0.1,
    x1: w * 0.9,
    y0: h * 0.68,
    y1: h * 0.9,
    arc: h * 0.05,
  };
}

function pathPoint(l: Layout, u: number): [number, number] {
  const x = l.x0 + (l.x1 - l.x0) * u;
  const y = l.y1 + (l.y0 - l.y1) * u - Math.sin(u * Math.PI) * l.arc;
  return [x, y];
}

type Frame = {
  exposures: { x: number; y: number; a: number; head: boolean }[];
  head: [number, number, number];
};

/** Which exposures are lit at cycle phase `phase` ∈ [0, 1). */
function exposeFrame(l: Layout, curve: Bezier, phase: number): Frame {
  const reveal = Math.min(phase / 0.52, 1);
  const fadeOut = phase > 0.86 ? 1 - (phase - 0.86) / 0.14 : 1;
  const lit = Math.floor(reveal * (l.count - 1) + 1e-6);
  const exposures: Frame["exposures"] = [];
  let head: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < l.count; i++) {
    const t = i / (l.count - 1);
    const [x, y] = pathPoint(l, bezierAt(curve, t));
    if (i > lit) {
      exposures.push({ x, y, a: 0, head: false });
      continue;
    }
    const isHead = i === lit;
    const age = (lit - i) / Math.max(l.count - 1, 1);
    const a = (isHead ? 1 : 0.85 - age * 0.55) * fadeOut;
    exposures.push({ x, y, a, head: isHead });
    if (isHead) head = [x, y, fadeOut];
  }
  return { exposures, head };
}

/* ------------------------------------------------------------------------ */

type ReadoutHandle = {
  set: (curve: Bezier, label: string, phase: number) => void;
};

const Readout = React.forwardRef<ReadoutHandle, { initial: Bezier; label: string }>(
  function Readout({ initial, label }, ref) {
    const pathRef = React.useRef<SVGPathElement>(null);
    const h1Ref = React.useRef<SVGLineElement>(null);
    const h2Ref = React.useRef<SVGLineElement>(null);
    const c1Ref = React.useRef<SVGCircleElement>(null);
    const c2Ref = React.useRef<SVGCircleElement>(null);
    const playRef = React.useRef<SVGLineElement>(null);
    const valueRef = React.useRef<HTMLSpanElement>(null);
    const labelRef = React.useRef<HTMLSpanElement>(null);
    const current = React.useRef<Bezier>(initial);
    const [copied, setCopied] = React.useState(false);

    const W = 168;
    const H = 104;
    const P = 10;
    const X = (v: number) => P + v * (W - P * 2);
    const Y = (v: number) => H - P - v * (H - P * 2);

    React.useImperativeHandle(ref, () => ({
      set(curve, nextLabel, phase) {
        current.current = curve;
        const [x1, y1, x2, y2] = curve;
        pathRef.current?.setAttribute("d", bezierPath(curve, W, H, P));
        h1Ref.current?.setAttribute("x2", String(X(x1)));
        h1Ref.current?.setAttribute("y2", String(Y(y1)));
        h2Ref.current?.setAttribute("x2", String(X(x2)));
        h2Ref.current?.setAttribute("y2", String(Y(y2)));
        c1Ref.current?.setAttribute("cx", String(X(x1)));
        c1Ref.current?.setAttribute("cy", String(Y(y1)));
        c2Ref.current?.setAttribute("cx", String(X(x2)));
        c2Ref.current?.setAttribute("cy", String(Y(y2)));
        const px = String(X(Math.min(phase / 0.52, 1)));
        playRef.current?.setAttribute("x1", px);
        playRef.current?.setAttribute("x2", px);
        if (valueRef.current) valueRef.current.textContent = formatBezier(curve);
        if (labelRef.current) labelRef.current.textContent = nextLabel;
      },
    }));

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(
          `transition-timing-function: ${formatBezier(current.current)};`,
        );
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      } catch {
        /* clipboard blocked — nothing to do */
      }
    };

    const [x1, y1, x2, y2] = initial;
    return (
      <div className="pointer-events-auto w-[min(100%,348px)] border border-hairline bg-carbon/80 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
          <span>reference.mp4</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse-soft rounded-full bg-accent" />
            24 fps
          </span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-3 h-[104px] w-full overflow-visible"
          aria-hidden
        >
          <rect x={P} y={P} width={W - P * 2} height={H - P * 2} fill="none" stroke="var(--border)" />
          <line ref={playRef} x1={P} x2={P} y1={P} y2={H - P} stroke="var(--accent)" strokeOpacity="0.5" />
          <line ref={h1Ref} x1={X(0)} y1={Y(0)} x2={X(x1)} y2={Y(y1)} stroke="var(--ink-3)" />
          <line ref={h2Ref} x1={X(1)} y1={Y(1)} x2={X(x2)} y2={Y(y2)} stroke="var(--ink-3)" />
          <path
            ref={pathRef}
            d={bezierPath(initial, W, H, P)}
            fill="none"
            stroke="var(--text)"
            strokeWidth="1.5"
          />
          <circle ref={c1Ref} cx={X(x1)} cy={Y(y1)} r="3" fill="var(--carbon)" stroke="var(--accent)" />
          <circle ref={c2Ref} cx={X(x2)} cy={Y(y2)} r="3" fill="var(--carbon)" stroke="var(--accent)" />
        </svg>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span ref={labelRef} className="block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
              {label}
            </span>
            <span ref={valueRef} className="mt-1 block whitespace-nowrap font-mono text-[11.5px] tabular-nums text-ink">
              {formatBezier(initial)}
            </span>
          </div>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 border border-hairline-strong px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 transition-colors hover:border-accent hover:text-ink"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    );
  },
);

/* ------------------------------------------------------------------------ */

function StaticPlate() {
  // SSR-safe still: the same exposure, frozen at rest, drawn in SVG.
  const l = layoutFor(1440, 900);
  const frame = exposeFrame(l, EASING_PRESETS[0].curve, 0.7);
  const path = Array.from({ length: PATH_SEGMENTS + 1 }, (_, i) =>
    pathPoint(l, i / PATH_SEGMENTS),
  );
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full max-lg:opacity-40"
      aria-hidden
    >
      <polyline
        points={path.map(([x, y]) => `${x},${y}`).join(" ")}
        fill="none"
        stroke="var(--text)"
        strokeOpacity="0.16"
      />
      {frame.exposures.map((e, i) =>
        e.a > 0 ? (
          <g key={i} opacity={e.a}>
            <rect
              x={e.x - l.box / 2}
              y={e.y - l.box / 2}
              width={l.box}
              height={l.box}
              rx={l.box * 0.24}
              fill={e.head ? "var(--accent)" : "none"}
              stroke={e.head ? "none" : "var(--text)"}
              strokeOpacity="0.6"
            />
            <circle cx={e.x} cy={e.y} r="1.8" fill={e.head ? "var(--carbon)" : "var(--text)"} />
          </g>
        ) : null,
      )}
    </svg>
  );
}

/** Reads an `R G B` channel token (e.g. `--accent-rgb`) as GL floats. */
function channels(value: string, fallback: [number, number, number]): [number, number, number] {
  const parts = value.trim().split(/[\s,]+/).map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return fallback;
  return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
}

export function Chronograph({ className }: { className?: string }) {
  const reduce = useHydratedReducedMotion();
  const hostRef = React.useRef<HTMLDivElement>(null);
  const readoutRef = React.useRef<ReadoutHandle>(null);
  const [live, setLive] = React.useState(false);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host || reduce || !canUseWebGL()) return;

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.6),
        alpha: false,
        antialias: false,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    const gl = renderer.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.className = "absolute inset-0 h-full w-full";
    canvas.setAttribute("aria-hidden", "true");
    host.prepend(canvas);

    const css = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: [number, number, number]) =>
      channels(css.getPropertyValue(name), fallback);

    // Plain arrays: ogl only resolves `uPts[0]`-style array uniforms when the
    // value is a JS Array (a typed array is reported as "not supplied").
    const pts: number[] = new Array(MAX_EXPOSURES * 4).fill(0);
    const path: number[] = new Array((PATH_SEGMENTS + 1) * 2).fill(0);
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uRes: { value: [1, 1] },
        uDpr: { value: renderer.dpr },
        uTime: { value: 0 },
        uBox: { value: 40 },
        uPathAlpha: { value: 1 },
        uPts: { value: pts },
        uPath: { value: path },
        uHead: { value: [0, 0, 0] },
        uAccent: { value: color("--accent-rgb", [1, 0.357, 0.122]) },
        uBone: { value: color("--bone-rgb", [0.929, 0.922, 0.894]) },
        uCarbon: { value: color("--carbon-rgb", [0.043, 0.043, 0.039]) },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    let layout = layoutFor(1, 1);
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      renderer.setSize(width, height);
      layout = layoutFor(width, height);
      program.uniforms.uRes.value = [width, height];
      program.uniforms.uBox.value = layout.box;
      for (let i = 0; i <= PATH_SEGMENTS; i++) {
        const [x, y] = pathPoint(layout, i / PATH_SEGMENTS);
        path[i * 2] = x;
        path[i * 2 + 1] = y;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // Curve state: idle cycles presets; the pointer takes over the handles.
    let presetIndex = 0;
    let target: Bezier = EASING_PRESETS[0].curve;
    const curve = [...target] as [number, number, number, number];
    let label = EASING_PRESETS[0].label;
    let manualUntil = 0;

    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const r = host.getBoundingClientRect();
      const px = Math.min(Math.max((event.clientX - r.left) / r.width, 0), 1);
      const py = Math.min(Math.max((event.clientY - r.top) / r.height, 0), 1);
      target = [
        +(0.02 + px * 0.66).toFixed(2),
        +(1.35 - py * 1.45).toFixed(2),
        +(0.12 + px * 0.6).toFixed(2),
        1,
      ];
      label = "Your curve";
      manualUntil = performance.now() + 2600;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(host);

    let raf = 0;
    let start = performance.now();
    let lastCycle = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;

      const elapsed = now - start;
      const cycle = Math.floor(elapsed / CYCLE_MS);
      const phase = (elapsed % CYCLE_MS) / CYCLE_MS;
      if (cycle !== lastCycle) {
        lastCycle = cycle;
        if (now > manualUntil) {
          presetIndex = (presetIndex + 1) % EASING_PRESETS.length;
          target = EASING_PRESETS[presetIndex].curve;
          label = EASING_PRESETS[presetIndex].label;
        }
      }
      for (let i = 0; i < 4; i++) curve[i] += (target[i] - curve[i]) * 0.12;

      const frame = exposeFrame(layout, curve, phase);
      pts.fill(0);
      frame.exposures.forEach((e, i) => {
        pts[i * 4] = e.x;
        pts[i * 4 + 1] = e.y;
        pts[i * 4 + 2] = e.a;
        pts[i * 4 + 3] = e.head ? 1 : 0;
      });
      program.uniforms.uHead.value = frame.head;
      program.uniforms.uTime.value = elapsed / 1000;
      renderer.render({ scene: mesh });
      readoutRef.current?.set(
        curve.map((v) => Math.round(v * 100) / 100) as unknown as Bezier,
        label,
        phase,
      );
    };
    raf = requestAnimationFrame((t) => {
      start = t;
      setLive(true);
      loop(t);
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
      setLive(false);
    };
  }, [reduce]);

  return (
    <div className={cn("absolute inset-0", className)}>
      <div ref={hostRef} className="absolute inset-0" data-chronograph={live ? "live" : "still"}>
        {live ? null : <StaticPlate />}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden justify-end pb-10 lg:flex container-page">
        <Readout ref={readoutRef} initial={EASING_PRESETS[0].curve} label={EASING_PRESETS[0].label} />
      </div>
    </div>
  );
}
