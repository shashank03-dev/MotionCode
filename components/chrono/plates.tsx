"use client";

import * as React from "react";

import { bezierAt, formatBezier, toCss, toFramer, toGsap, type Bezier, type MotionSpec } from "@/lib/chrono/bezier";
import { cn } from "@/lib/utils";

/**
 * The three "How it works" plates — animated SVG instruments, one per act:
 *
 *   ReferencePlate — a clip is dropped in, then plays as a chronophotograph
 *                    (ghost exposures bunch up where the card slows down).
 *   AnalyzePlate   — a scan beam reads a film strip; each frame drops its
 *                    sample into a Marey plot; the curve draws through them and
 *                    a probe rides it, moved by the very easing it recovered.
 *   ShipPlate      — the spec transcribes itself into CSS → GSAP → Framer, with
 *                    a live preview running on the generated curve.
 *
 * All motion is CSS keyframes (`.pl*` in globals.css) sharing one loop length
 * per plate, so every element stays in phase. Plates only run while on screen
 * (`data-live`), and under reduced motion each shows a composed still.
 */

const CURVE: Bezier = [0.16, 1, 0.3, 1];
const EASE = formatBezier(CURVE);

/** Plays a plate's keyframes only while it is in view. */
function usePlateLive<T extends Element>() {
  const ref = React.useRef<T>(null);
  const [live, setLive] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, live] as const;
}

const v = (vars: Record<string, string | number>) => vars as React.CSSProperties;

/* ------------------------------------------------------------------------ */
/* 01 — Reference                                                            */
/* ------------------------------------------------------------------------ */

const P1_SAMPLES = Array.from({ length: 9 }, (_, i) => i / 8);
const P1_FROM = 264; // card top before the move (66% of the frame)
const P1_TO = 104; // card top after (26%) — matches the pinned sequence frames
const P1_RISE_S = 0.22 * 7; // rise window: 22% of the 7s loop

export function ReferencePlate({ className, bare = false }: { className?: string; bare?: boolean }) {
  const [ref, live] = usePlateLive<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-live={live}
      className={cn("mc-plate pl1 relative aspect-[3/2] overflow-hidden bg-[#10100e]", !bare && "border border-hairline-strong", className)}
    >
      <svg viewBox="0 0 600 400" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="pl1-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="0.8" fill="var(--text)" fillOpacity="0.07" />
          </pattern>
          <radialGradient id="pl1-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
          </radialGradient>
          <linearGradient id="pl1-scan" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--text)" stopOpacity="0" />
            <stop offset="0.8" stopColor="var(--text)" stopOpacity="0.04" />
            <stop offset="1" stopColor="var(--text)" stopOpacity="0" />
          </linearGradient>
          <filter id="pl1-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id="pl1-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        <rect width="600" height="400" fill="url(#pl1-grid)" />

        {/* — the drop: a clip is dragged in and lands — */}
        <g className="pl1-drop">
          <rect x="24" y="24" width="552" height="352" rx="10" fill="none" stroke="var(--text)" strokeOpacity="0.22" strokeDasharray="6 6" className="pl-ants" />
          <rect x="24" y="24" width="552" height="352" rx="10" fill="none" stroke="var(--accent)" strokeDasharray="6 6" className="pl-ants pl1-hot" />
          <g className="pl1-hint" fill="none" stroke="var(--text)" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M300 118 v30 m-10 -10 l10 10 l10 -10" />
            <path d="M278 150 v8 h44 v-8" />
          </g>
          <text x="300" y="282" textAnchor="middle" className="pl1-hint fill-[var(--ink-3)] font-mono text-[11px] uppercase tracking-[0.18em]">
            mp4 · mov · gif · webm
          </text>
          <circle cx="300" cy="200" r="60" fill="none" stroke="var(--accent)" className="pl1-ripple" />
          <circle cx="300" cy="200" r="60" fill="none" stroke="var(--accent)" className="pl1-ripple" style={v({ "--d": "0.18s" })} />

          <g className="pl1-chip">
            <rect x="214" y="176" width="172" height="48" rx="9" fill="#1d1c18" stroke="var(--text)" strokeOpacity="0.3" />
            <rect x="228" y="189" width="22" height="22" rx="3" fill="none" stroke="var(--text)" strokeOpacity="0.6" />
            {[0, 1, 2].map((i) => (
              <React.Fragment key={i}>
                <rect x="230.5" y={191.5 + i * 6.5} width="2.5" height="3" fill="var(--text)" fillOpacity="0.5" />
                <rect x="245" y={191.5 + i * 6.5} width="2.5" height="3" fill="var(--text)" fillOpacity="0.5" />
              </React.Fragment>
            ))}
            <path d="M237 196 l6 4 l-6 4 z" fill="var(--accent)" />
            <text x="262" y="198" className="fill-[var(--text)] font-mono text-[12px]">reference.mp4</text>
            <text x="262" y="213" className="fill-[var(--ink-3)] font-mono text-[9px] tracking-[0.08em]">2.4 MB · 60 FPS</text>
          </g>
          <path
            className="pl1-cursor"
            d="M372 210 l0 22 l5.5 -5 l4 9 l3.5 -1.6 l-4 -9 l7.5 -0.4 z"
            fill="var(--text)"
            stroke="#10100e"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </g>

        {/* — the clip: the card's move, exposed many times on one plate — */}
        <g className="pl1-clip">
          <rect x="48" y="31" width="60" height="3" rx="1.5" fill="var(--text)" fillOpacity="0.2" />
          <rect x="118" y="31" width="36" height="3" rx="1.5" fill="var(--text)" fillOpacity="0.1" />
          <rect x="504" y="31" width="48" height="3" rx="1.5" fill="var(--text)" fillOpacity="0.1" />

          {/* exposure rail: one tick per equal slice of time */}
          <line x1="176" x2="176" y1={P1_TO + 36} y2={P1_FROM + 36} stroke="var(--text)" strokeOpacity="0.12" />
          {P1_SAMPLES.map((f, i) => {
            const top = P1_FROM - (P1_FROM - P1_TO) * bezierAt(CURVE, f);
            const style = v({ "--d": `${(f * P1_RISE_S).toFixed(3)}s`, "--o": (0.08 + 0.035 * i).toFixed(3) });
            return (
              <g key={i} className="pl1-ghost" style={style}>
                <rect x="198" y={top} width="204" height="72" rx="8" fill="var(--text)" fillOpacity="0.025" stroke="var(--text)" />
                <circle cx="176" cy={top + 36} r="2.5" fill="var(--text)" />
              </g>
            );
          })}

          <g className="pl1-card">
            <rect x="214" y={P1_TO + 30} width="172" height="60" rx="10" fill="#000" fillOpacity="0.8" filter="url(#pl1-soft)" />
            <rect x="198" y={P1_TO} width="204" height="72" rx="8" fill="#26241f" stroke="var(--text)" strokeOpacity="0.5" />
            <rect x="218" y={P1_TO + 20} width="122" height="5" rx="2.5" fill="var(--text)" fillOpacity="0.7" />
            <rect x="218" y={P1_TO + 36} width="164" height="4" rx="2" fill="var(--text)" fillOpacity="0.15" />
            <rect x="218" y={P1_TO + 48} width="134" height="4" rx="2" fill="var(--text)" fillOpacity="0.15" />
            <circle cx="176" cy={P1_TO + 36} r="7" fill="var(--accent)" opacity="0.6" filter="url(#pl1-glow)" />
            <circle cx="176" cy={P1_TO + 36} r="3.5" fill="var(--accent)" />
            <line x1="180" x2="198" y1={P1_TO + 36} y2={P1_TO + 36} stroke="var(--accent)" strokeOpacity="0.5" strokeDasharray="2 3" />
          </g>

          {/* viewfinder chrome */}
          <g fill="none" stroke="var(--text)" strokeOpacity="0.45" strokeWidth="1.2">
            <path d="M24 44 V24 H44" />
            <path d="M556 24 H576 V44" />
            <path d="M24 356 V376 H44" />
            <path d="M576 356 V376 H556" />
          </g>
          <g stroke="var(--text)" strokeOpacity="0.25">
            <line x1="300" x2="300" y1="192" y2="208" />
            <line x1="292" x2="308" y1="200" y2="200" />
          </g>

          {/* scrubber */}
          <line x1="48" x2="552" y1="352" y2="352" stroke="var(--text)" strokeOpacity="0.14" />
          {Array.from({ length: 25 }, (_, i) => (
            <line key={i} x1={48 + i * 21} x2={48 + i * 21} y1={i % 6 === 0 ? 345 : 348} y2="352" stroke="var(--text)" strokeOpacity={i % 6 === 0 ? 0.35 : 0.15} />
          ))}
          <line x1="48" x2="552" y1="352" y2="352" stroke="var(--accent)" strokeWidth="1.5" className="pl1-progress" />
          <g className="pl1-playhead">
            <rect x="47" y="341" width="2" height="16" rx="1" fill="var(--accent)" />
          </g>
        </g>

        <rect width="600" height="120" fill="url(#pl1-scan)" className="pl-scan" />
        <rect width="600" height="400" fill="url(#pl1-vignette)" />
      </svg>

      {/* HTML labels stay crisp at every size */}
      <div className="pl1-clip pointer-events-none absolute left-[6%] top-[11%] flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2" aria-hidden>
        <span className="size-1.5 animate-pulse-soft rounded-full bg-accent" />
        rec
        <span className="viewfinder-tc ml-1 tabular-nums text-ink-3" />
      </div>
      <div className="pl1-drop pointer-events-none absolute inset-x-0 top-[58%] text-center text-[13px] tracking-[-0.01em] text-ink-2" aria-hidden>
        <span className="pl1-hint inline-block">Drop a clip — or paste a link</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 02 — Analyze                                                              */
/* ------------------------------------------------------------------------ */

const P2_N = 8;
const P2_SAMPLES = Array.from({ length: P2_N }, (_, i) => bezierAt(CURVE, i / (P2_N - 1)));
const PLOT = { x: 48, y: 150, w: 504, h: 222 };
const plotX = (t: number) => PLOT.x + t * PLOT.w;
const plotY = (p: number) => PLOT.y + PLOT.h - p * PLOT.h;
const P2_CURVE_D = `M${plotX(0)} ${plotY(0)} C${plotX(CURVE[0])} ${plotY(CURVE[1])} ${plotX(CURVE[2])} ${plotY(CURVE[3])} ${plotX(1)} ${plotY(1)}`;

export function AnalyzePlate({ className }: { className?: string }) {
  const [ref, live] = usePlateLive<HTMLDivElement>();
  return (
    <div ref={ref} data-live={live} className={cn("mc-plate pl2 relative aspect-[3/2] overflow-hidden border border-hairline-strong bg-[#10100e]", className)}>
      <svg viewBox="0 0 600 400" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="pl2-beam" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0" />
            <stop offset="0.8" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pl2-ink" x1={PLOT.x} x2={PLOT.x + PLOT.w} y1="0" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--text)" stopOpacity="0.55" />
            <stop offset="0.55" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
          <filter id="pl2-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* film strip */}
        <rect x="0" y="16" width="600" height="104" fill="#0c0c0b" />
        <line x1="0" x2="600" y1="16" y2="16" stroke="var(--border-strong)" />
        <line x1="0" x2="600" y1="120" y2="120" stroke="var(--border-strong)" />
        {Array.from({ length: 34 }, (_, i) => (
          <React.Fragment key={i}>
            <rect x={6 + i * 18} y="22" width="8" height="5" rx="1" fill="var(--text)" fillOpacity="0.1" />
            <rect x={6 + i * 18} y="109" width="8" height="5" rx="1" fill="var(--text)" fillOpacity="0.1" />
          </React.Fragment>
        ))}

        {P2_SAMPLES.map((p, i) => {
          const fx = 16 + i * 72;
          const top = 46 + 42 * (1 - p);
          return (
            <g key={i}>
              <rect x={fx} y="34" width="64" height="68" fill="#141412" stroke="var(--text)" strokeOpacity="0.14" />
              <rect x={fx + 6} y="40" width="12" height="1.5" fill="var(--text)" fillOpacity="0.2" />
              <rect x={fx + 18} y={top} width="28" height="10" rx="2" fill="#26241f" stroke="var(--text)" strokeOpacity="0.5" strokeWidth="0.8" />
              <rect
                x={fx}
                y="34"
                width="64"
                height="68"
                fill="none"
                stroke="var(--accent)"
                className="pl2-lit"
                style={v({ "--d": `${((8 * 0.28 * (i + 0.5)) / P2_N).toFixed(3)}s` })}
              />
              <text x={fx + 4} y="98" className="fill-[var(--ink-3)] font-mono text-[7px]">
                F{String(i * 3).padStart(2, "0")}
              </text>
            </g>
          );
        })}

        <g className="pl2-beam">
          <rect x="-40" y="16" width="44" height="104" fill="url(#pl2-beam)" />
          <line x1="4" x2="4" y1="16" y2="120" stroke="var(--accent)" strokeWidth="1.5" />
        </g>

        {/* Marey plot */}
        <g stroke="var(--border)">
          {[0.25, 0.5, 0.75].map((r) => (
            <line key={r} x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={plotY(r)} y2={plotY(r)} />
          ))}
        </g>
        <rect x={PLOT.x} y={PLOT.y} width={PLOT.w} height={PLOT.h} fill="none" stroke="var(--border-strong)" />
        <text x={PLOT.x - 8} y={PLOT.y + 4} textAnchor="end" className="fill-[var(--ink-3)] font-mono text-[9px]">1</text>
        <text x={PLOT.x - 8} y={PLOT.y + PLOT.h + 3} textAnchor="end" className="fill-[var(--ink-3)] font-mono text-[9px]">0</text>
        <text x={PLOT.x + PLOT.w} y={PLOT.y + PLOT.h + 18} textAnchor="end" className="fill-[var(--ink-3)] font-mono text-[9px] uppercase tracking-[0.14em]">
          time →
        </text>
        <text x={PLOT.x} y={PLOT.y + PLOT.h + 18} className="fill-[var(--ink-3)] font-mono text-[9px] uppercase tracking-[0.14em]">
          8 samples · 24 fps
        </text>

        {P2_SAMPLES.map((p, i) => {
          const x = plotX(i / (P2_N - 1));
          const from = 46 + 42 * (1 - p) + 5;
          const to = plotY(p);
          const style = v({ "--d": `${(i * 0.16).toFixed(2)}s`, "--dy": `${(from - to).toFixed(1)}px` });
          return (
            <g key={i}>
              <line x1={x} x2={x} y1={from} y2={to} stroke="var(--text)" strokeOpacity="0.2" strokeDasharray="2 3" className="pl2-leader" style={style} />
              <g className="pl2-dot" style={style}>
                <circle cx={x} cy={to} r="4.5" fill="#10100e" stroke="var(--text)" strokeWidth="1.5" />
              </g>
            </g>
          );
        })}

        <path d={P2_CURVE_D} fill="none" stroke="var(--accent)" strokeWidth="5" opacity="0.35" filter="url(#pl2-glow)" pathLength={1} className="pl2-curve" />
        <path d={P2_CURVE_D} fill="none" stroke="url(#pl2-ink)" strokeWidth="2" strokeLinecap="round" pathLength={1} className="pl2-curve" />

        {/* probe: x runs linearly in time, y runs on the recovered easing */}
        <g className="pl2-py">
          <line x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={plotY(0)} y2={plotY(0)} stroke="var(--accent)" strokeOpacity="0.3" strokeDasharray="3 4" />
        </g>
        <g className="pl2-px">
          <line x1={PLOT.x} x2={PLOT.x} y1={PLOT.y} y2={PLOT.y + PLOT.h} stroke="var(--accent)" strokeOpacity="0.3" strokeDasharray="3 4" />
          <g className="pl2-py">
            <circle cx={PLOT.x} cy={plotY(0)} r="10" fill="none" stroke="var(--accent)" className="pl2-halo" />
            <circle cx={PLOT.x} cy={plotY(0)} r="4" fill="var(--accent)" />
          </g>
        </g>

        <text x={PLOT.x + PLOT.w} y={PLOT.y - 12} textAnchor="end" className="pl2-readout fill-[var(--text)] font-mono text-[11px]">
          {EASE}
        </text>
        <text x={PLOT.x} y={PLOT.y - 12} className="fill-[var(--ink-3)] font-mono text-[9px] uppercase tracking-[0.14em]">
          progress
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* 03 — Ship                                                                 */
/* ------------------------------------------------------------------------ */

const SPEC: MotionSpec = { target: ".card", property: "translateY", from: 148, to: 0, durationMs: 420, curve: CURVE };
const TABS = [
  { label: "CSS", code: toCss(SPEC) },
  { label: "GSAP", code: toGsap(SPEC) },
  { label: "Framer", code: toFramer(SPEC) },
].map((tab) => ({ ...tab, lines: tab.code.split("\n") }));
const P3_LOOP = 9;
const P3_SLOT = P3_LOOP / TABS.length;

const TOKEN = /(cubic-bezier\([^)]*\)|ease: \[[^\]]*\]|"[^"]*"|\b\d+(?:\.\d+)?(?:ms|px)?\b|@keyframes|@media|\bimport\b|\bexport\b|\bfunction\b|\breturn\b)/;

function Highlight({ line }: { line: string }) {
  return (
    <>
      {line.split(TOKEN).map((part, i) => {
        if (!part) return null;
        const cls = /^(cubic-bezier|ease: \[)/.test(part)
          ? "text-accent"
          : /^"/.test(part)
            ? "text-ink"
            : /^\d/.test(part)
              ? "text-bone"
              : TOKEN.test(part)
                ? "text-ink-3"
                : undefined;
        return (
          <span key={i} className={cls}>
            {part}
          </span>
        );
      })}
    </>
  );
}

const PREVIEW_TICKS = Array.from({ length: 7 }, (_, i) => bezierAt(CURVE, i / 6));

export function ShipPlate({ className }: { className?: string }) {
  const [ref, live] = usePlateLive<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-live={live}
      className={cn("mc-plate pl3 relative overflow-hidden border border-hairline-strong bg-[#10100e]", className)}
      style={v({ "--loop": `${P3_LOOP}s`, "--slot": `${P3_SLOT}s` })}
    >
      {/* window chrome + tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-2.5">
        <div className="flex items-center gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-2 rounded-full bg-bone/15" />
          ))}
          <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">motion.spec</span>
        </div>
        <div className="relative flex font-mono text-[10.5px] uppercase tracking-[0.12em]" aria-hidden>
          {TABS.map((tab, k) => (
            <span
              key={tab.label}
              className="pl3-tab w-16 py-1 text-center"
              style={v({ "--d": `${(k * P3_SLOT - P3_LOOP).toFixed(2)}s` })}
            >
              {tab.label}
            </span>
          ))}
          <span className="pl3-underline absolute -bottom-[11px] left-0 h-px w-16 bg-accent" />
        </div>
      </div>

      {/* code panes, transcribed line by line */}
      <div className="relative h-[292px] overflow-hidden px-4 py-4 font-mono text-[10px] leading-[1.65] text-ink-2 sm:text-[10.5px]">
        {TABS.map((tab, k) => (
          <pre
            key={tab.label}
            className={cn("pl3-pane absolute inset-x-4 top-4", k > 0 && "pl3-pane--rest")}
            style={v({ "--d": `${(k * P3_SLOT - P3_LOOP).toFixed(2)}s` })}
            aria-label={k === 0 ? `${tab.label} output` : undefined}
            aria-hidden={k > 0 || undefined}
          >
            <code>
              {tab.lines.map((line, i) => (
                <span
                  key={i}
                  className="pl3-line block whitespace-pre"
                  style={v({ "--d": `${(k * P3_SLOT - P3_LOOP + 0.25 + i * 0.07).toFixed(2)}s` })}
                >
                  <span className="mr-3 inline-block w-4 select-none text-right text-ink-3/50">{i + 1}</span>
                  <Highlight line={line || " "} />
                </span>
              ))}
            </code>
          </pre>
        ))}
      </div>

      {/* live preview on the generated curve + copy */}
      <div className="flex items-center gap-4 border-t border-hairline px-4 py-3">
        <svg viewBox="0 0 300 28" className="h-7 min-w-0 flex-1" aria-hidden>
          <line x1="10" x2="290" y1="14" y2="14" stroke="var(--text)" strokeOpacity="0.14" />
          {PREVIEW_TICKS.map((p, i) => (
            <line key={i} x1={10 + 264 * p + 8} x2={10 + 264 * p + 8} y1="9" y2="19" stroke="var(--text)" strokeOpacity={0.12 + i * 0.05} />
          ))}
          <g className="pl3-runner">
            <rect x="10" y="6" width="16" height="16" rx="4" fill="#26241f" stroke="var(--text)" strokeOpacity="0.6" />
            <circle cx="18" cy="14" r="2" fill="var(--accent)" />
          </g>
        </svg>
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 sm:inline">420ms · expo-out</span>
        <span className="relative inline-flex h-7 w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-hairline-strong font-mono text-[10px] uppercase tracking-[0.14em]" aria-hidden>
          <span className="pl3-copy pl3-copy--idle absolute inset-0 flex items-center justify-center text-ink-2">Copy</span>
          <span className="pl3-copy pl3-copy--done absolute inset-0 flex items-center justify-center gap-1.5 text-ink">
            <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6.5 L5 9 L10 3" pathLength={1} className="pl3-check" />
            </svg>
            Copied
          </span>
        </span>
      </div>
    </div>
  );
}
