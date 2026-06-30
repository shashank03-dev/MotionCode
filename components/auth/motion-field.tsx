"use client";

/* MotionField — "Easing Studio".
 *
 * A living motion graph-editor that speaks MotionCode's own language: the
 * product turns a motion reference into a normalized spec + code (easing,
 * duration, transforms) for CSS / GSAP / Framer Motion. So the art is a
 * cubic-bezier easing curve being authored in real time — breathing between
 * real named easings, with control-point handles, a playhead, a sample dot that
 * rides the curve, and a stage marker above that travels with that exact easing
 * (curve → motion). A mono readout prints the live `cubic-bezier(...)` spec. The
 * cursor grabs the nearest handle and bends the curve ("move the cursor to
 * sample"). Everything is procedural — no source image. */

import { type MutableRefObject, useEffect, useRef } from "react";

export type MotionFieldProps = {
  className?: string;
  /** background void color */
  background?: string;
  /** structural / grid / handle / text color */
  base?: string;
  /** the brand accent — the curve and live values */
  accent?: string;
  /** grab radius for the cursor, in css px (unused name kept for the call site) */
  sampleRadius?: number;
  /** parent bumps `current` on keydown; field reads + decays it (pulses the curve) */
  typingImpulseRef?: MutableRefObject<number>;
};

type CP = { x1: number; y1: number; x2: number; y2: number };
type Preset = { name: string; cp: CP };
type RGB = [number, number, number];

const PRESETS: Preset[] = [
  { name: "easeInOut", cp: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 } },
  { name: "easeOutExpo", cp: { x1: 0.16, y1: 1, x2: 0.3, y2: 1 } },
  { name: "easeOutBack", cp: { x1: 0.34, y1: 1.56, x2: 0.64, y2: 1 } },
  { name: "easeInOutQuint", cp: { x1: 0.83, y1: 0, x2: 0.17, y2: 1 } },
  { name: "backInOut", cp: { x1: 0.6, y1: -0.28, x2: 0.32, y2: 1.28 } },
  { name: "easeOutCirc", cp: { x1: 0, y1: 0.55, x2: 0.45, y2: 1 } },
];

const V_MIN = -0.3;
const V_MAX = 1.32;
const GHOSTS = 5;

const parseRGB = (c: string): RGB => {
  const m = c.match(/(\d+(?:\.\d+)?)/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [255, 255, 255];
};
const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;
/** CSS-style number: 0.34 → ".34", -0.18 → "-.18". */
const css = (v: number) =>
  v.toFixed(2).replace(/^(-?)0\./, "$1.").replace(/\.00$/, "");

/** WebKit UnitBezier: sample the curve, and solve progress at a given time. */
function bezier(cp: CP) {
  const cx = 3 * cp.x1;
  const bx = 3 * (cp.x2 - cp.x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * cp.y1;
  const by = 3 * (cp.y2 - cp.y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const solveX = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-6) return t;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 24; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-6) break;
      if (e < 0) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return { sx, sy, progress: (x: number) => sy(solveX(x)) };
}

export function MotionField({
  className,
  background = "rgba(7, 8, 6, 1)",
  base = "rgba(216, 207, 188, 1)",
  accent = "rgba(0, 255, 136, 1)",
  typingImpulseRef,
}: MotionFieldProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const cfg = useRef({ background, base, accent });
  useEffect(() => {
    cfg.current = { background, base, accent };
  }, [background, base, accent]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fontFamily =
      getComputedStyle(wrapper).fontFamily || "ui-monospace, monospace";

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let destroyed = false;

    // live (eased) control points + the target they chase
    const cp: CP = { ...PRESETS[0].cp };
    const target: CP = { ...PRESETS[0].cp };
    let label = PRESETS[0].name;
    let custom = false;
    let presetIdx = 0;
    let dwell = 0;
    const DWELL = 150; // frames a preset is held before morphing
    let loopT = 0;
    let holdT = 0;
    let t = 0;
    const ghosts: CP[] = [];
    const stageTrail: { x: number; y: number }[] = [];

    // plot geometry (css px), recomputed on resize
    let plotL = 0;
    let plotR = 0;
    let plotTop = 0;
    let plotBot = 0;
    let stageY = 0;

    const layout = () => {
      plotL = w * 0.15;
      plotR = w * 0.87;
      plotTop = h * 0.41;
      plotBot = h * 0.82;
      stageY = h * 0.25;
    };

    const X = (tt: number) => plotL + tt * (plotR - plotL);
    const Y = (v: number) =>
      plotBot - ((v - V_MIN) / (V_MAX - V_MIN)) * (plotBot - plotTop);

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      layout();
    };

    const handlePos = (which: 1 | 2) =>
      which === 1
        ? { x: X(cp.x1), y: Y(cp.y1) }
        : { x: X(cp.x2), y: Y(cp.y2) };

    const updateTarget = () => {
      const p = pointerRef.current;
      // hover-grab: nearest handle within radius follows the cursor
      if (p.active && p.x > plotL - 40 && p.x < plotR + 40) {
        const h1 = handlePos(1);
        const h2 = handlePos(2);
        const d1 = Math.hypot(p.x - h1.x, p.y - h1.y);
        const d2 = Math.hypot(p.x - h2.x, p.y - h2.y);
        const grab = 30;
        if (Math.min(d1, d2) < grab) {
          const tt = clamp((p.x - plotL) / (plotR - plotL), -0.1, 1.1);
          const vv = clamp(
            (plotBot - p.y) / (plotBot - plotTop) * (V_MAX - V_MIN) + V_MIN,
            V_MIN + 0.04,
            V_MAX - 0.04,
          );
          if (d1 <= d2) {
            target.x1 = tt;
            target.y1 = vv;
          } else {
            target.x2 = tt;
            target.y2 = vv;
          }
          custom = true;
          label = "custom";
          dwell = 0;
          return;
        }
      }
      // auto: dwell on a preset, then morph to the next
      if (!custom || (!p.active && dwell === 0)) {
        custom = false;
        dwell += 1;
        if (dwell > DWELL) {
          dwell = 0;
          presetIdx = (presetIdx + 1) % PRESETS.length;
          const next = PRESETS[presetIdx];
          target.x1 = next.cp.x1;
          target.y1 = next.cp.y1;
          target.x2 = next.cp.x2;
          target.y2 = next.cp.y2;
          label = next.name;
        }
      }
    };

    const easeCP = () => {
      const k = 0.07;
      cp.x1 += (target.x1 - cp.x1) * k;
      cp.y1 += (target.y1 - cp.y1) * k;
      cp.x2 += (target.x2 - cp.x2) * k;
      cp.y2 += (target.y2 - cp.y2) * k;
    };

    const drawScene = (animate: boolean) => {
      const { background: bgC, base: baseC, accent: accC } = cfg.current;
      const [bgR, bgG, bgB] = parseRGB(bgC);
      const [bR, bG, bB] = parseRGB(baseC);
      const [aR, aG, aB] = parseRGB(accC);
      const boneA = (a: number) => `rgba(${bR},${bG},${bB},${a})`;
      const grnA = (a: number) => `rgba(${aR},${aG},${aB},${a})`;

      const typing = typingImpulseRef?.current ?? 0;
      if (typingImpulseRef && typing > 1e-4) typingImpulseRef.current *= 0.93;

      ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
      ctx.fillRect(0, 0, w, h);

      // ---- grid + axes -------------------------------------------------
      ctx.lineWidth = 1;
      // vertical time gridlines
      for (let i = 0; i <= 4; i++) {
        const gx = X(i / 4);
        ctx.strokeStyle = boneA(i === 0 || i === 4 ? 0.14 : 0.06);
        ctx.beginPath();
        ctx.moveTo(gx, Y(V_MAX) - 2);
        ctx.lineTo(gx, Y(V_MIN));
        ctx.stroke();
      }
      // value baselines: 0 (start) solid faint, 1 (target) dashed green
      ctx.strokeStyle = boneA(0.16);
      ctx.beginPath();
      ctx.moveTo(plotL, Y(0));
      ctx.lineTo(plotR, Y(0));
      ctx.stroke();
      ctx.save();
      ctx.setLineDash([2, 5]);
      ctx.strokeStyle = grnA(0.22);
      ctx.beginPath();
      ctx.moveTo(plotL, Y(1));
      ctx.lineTo(plotR, Y(1));
      ctx.stroke();
      ctx.restore();
      // bottom time ruler
      for (let i = 0; i <= 16; i++) {
        const gx = X(i / 16);
        const major = i % 4 === 0;
        ctx.strokeStyle = boneA(major ? 0.22 : 0.1);
        ctx.beginPath();
        ctx.moveTo(gx, Y(V_MIN));
        ctx.lineTo(gx, Y(V_MIN) + (major ? 8 : 4));
        ctx.stroke();
      }

      // ---- ghost curves (recent history → breathing trail) -------------
      ctx.lineWidth = 1;
      for (let g = 0; g < ghosts.length; g++) {
        const gb = bezier(ghosts[g]);
        const a = ((g + 1) / ghosts.length) * 0.12;
        ctx.strokeStyle = grnA(a);
        ctx.beginPath();
        for (let i = 0; i <= 48; i++) {
          const s = i / 48;
          const x = X(gb.sx(s));
          const y = Y(gb.sy(s));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // ---- the easing curve --------------------------------------------
      const b = bezier(cp);
      const path = () => {
        ctx.beginPath();
        for (let i = 0; i <= 72; i++) {
          const s = i / 72;
          const x = X(b.sx(s));
          const y = Y(b.sy(s));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      };
      ctx.save();
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = grnA(0.9);
      ctx.shadowBlur = 14 + typing * 18;
      ctx.strokeStyle = grnA(0.5);
      ctx.lineWidth = 4.5;
      path();
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = grnA(0.95);
      ctx.lineWidth = 1.6;
      path();
      ctx.stroke();

      // ---- control handles ---------------------------------------------
      const p0 = { x: X(0), y: Y(0) };
      const p3 = { x: X(1), y: Y(1) };
      const h1 = handlePos(1);
      const h2 = handlePos(2);
      ctx.strokeStyle = boneA(0.4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(h1.x, h1.y);
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(h2.x, h2.y);
      ctx.stroke();
      // endpoint dots
      ctx.fillStyle = boneA(0.7);
      for (const p of [p0, p3]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      // handle squares
      const grabbed = custom && pointerRef.current.active;
      for (const hp of [h1, h2]) {
        ctx.fillStyle = `rgb(${bgR},${bgG},${bgB})`;
        ctx.strokeStyle = grabbed ? grnA(0.95) : boneA(0.8);
        ctx.lineWidth = 1.3;
        const s = 4.5;
        ctx.beginPath();
        ctx.rect(hp.x - s, hp.y - s, s * 2, s * 2);
        ctx.fill();
        ctx.stroke();
      }

      // ---- playhead + sample dot + stage motion ------------------------
      let prog = b.progress(clamp(loopT, 0, 1));
      if (animate) {
        // playhead vertical line
        const phx = X(clamp(loopT, 0, 1));
        ctx.strokeStyle = boneA(0.18);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(phx, Y(V_MAX) - 2);
        ctx.lineTo(phx, Y(V_MIN));
        ctx.stroke();

        // leader from curve point to the value axis on the right
        const dotY = Y(prog);
        ctx.save();
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = grnA(0.3);
        ctx.beginPath();
        ctx.moveTo(phx, dotY);
        ctx.lineTo(plotR + 14, dotY);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = grnA(0.85);
        ctx.fillRect(plotR + 12, dotY - 1, 5, 2);

        // glowing sample dot on the curve
        ctx.save();
        ctx.shadowColor = grnA(0.9);
        ctx.shadowBlur = 12;
        ctx.fillStyle = grnA(1);
        ctx.beginPath();
        ctx.arc(phx, dotY, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        prog = b.progress(0.42);
      }

      // ---- stage: the resulting motion ---------------------------------
      const sL = plotL;
      const sR = plotR;
      ctx.strokeStyle = boneA(0.16);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sL, stageY);
      ctx.lineTo(sR, stageY);
      ctx.stroke();
      for (const ex of [sL, sR]) {
        ctx.strokeStyle = boneA(0.3);
        ctx.beginPath();
        ctx.moveTo(ex, stageY - 5);
        ctx.lineTo(ex, stageY + 5);
        ctx.stroke();
      }
      const mx = sL + prog * (sR - sL);
      if (animate) {
        stageTrail.push({ x: mx, y: stageY });
        if (stageTrail.length > 16) stageTrail.shift();
        for (let i = 0; i < stageTrail.length; i++) {
          const a = (i / stageTrail.length) * 0.5;
          ctx.fillStyle = grnA(a);
          ctx.beginPath();
          ctx.arc(stageTrail[i].x, stageTrail[i].y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.save();
      ctx.shadowColor = grnA(0.9);
      ctx.shadowBlur = 12;
      ctx.fillStyle = grnA(1);
      ctx.beginPath();
      ctx.arc(mx, stageY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // a hairline ring marks the motion's target
      ctx.strokeStyle = grnA(0.4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sR, stageY, 6, 0, Math.PI * 2);
      ctx.stroke();

      // ---- mono readout: the spec the product emits --------------------
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      const rx = plotL;
      const ry = h * 0.335;
      ctx.font = `600 12px ${fontFamily}`;
      ctx.fillStyle = boneA(0.92);
      ctx.fillText(label.toUpperCase(), rx, ry);
      ctx.font = `13px ${fontFamily}`;
      ctx.fillStyle = grnA(0.92);
      ctx.fillText(
        `cubic-bezier(${css(cp.x1)}, ${css(cp.y1)}, ${css(cp.x2)}, ${css(cp.y2)})`,
        rx,
        ry + 19,
      );
      ctx.font = `10px ${fontFamily}`;
      ctx.fillStyle = boneA(0.34);
      ctx.fillText("css · gsap · framer", rx, ry + 36);
    };

    const loop = () => {
      if (destroyed) return;
      t += 1;
      updateTarget();
      easeCP();
      // record ghosts of the curve as it morphs
      if (t % 7 === 0) {
        ghosts.push({ ...cp });
        if (ghosts.length > GHOSTS) ghosts.shift();
      }
      // playhead time with a hold at each end for readability
      const HOLD = 26;
      const SPAN = 118;
      if (holdT > 0) {
        holdT -= 1;
      } else {
        loopT += 1 / SPAN;
        if (loopT >= 1) {
          loopT = 0;
          holdT = HOLD;
          stageTrail.length = 0;
        }
      }
      drawScene(true);
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const rect = wrapper.getBoundingClientRect();
      pointerRef.current.x = e.clientX - rect.left;
      pointerRef.current.y = e.clientY - rect.top;
      pointerRef.current.active = true;
    };
    const onLeave = () => {
      pointerRef.current.active = false;
      pointerRef.current.x = -9999;
      pointerRef.current.y = -9999;
      custom = false;
    };

    const ro = new ResizeObserver(() => resize());
    ro.observe(wrapper);
    resize();
    wrapper.addEventListener("pointermove", onMove);
    wrapper.addEventListener("pointerleave", onLeave);

    if (reduce) {
      target.x1 = PRESETS[2].cp.x1;
      target.y1 = PRESETS[2].cp.y1;
      target.x2 = PRESETS[2].cp.x2;
      target.y2 = PRESETS[2].cp.y2;
      cp.x1 = target.x1;
      cp.y1 = target.y1;
      cp.x2 = target.x2;
      cp.y2 = target.y2;
      label = PRESETS[2].name;
      drawScene(false);
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrapper.removeEventListener("pointermove", onMove);
      wrapper.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        fontFamily: "var(--font-bridge-mono, ui-monospace, monospace)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}
