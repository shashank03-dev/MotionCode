"use client";

import * as React from "react";

import { bezierAt, type Bezier } from "@/lib/chrono/bezier";
import { cn } from "@/lib/utils";

import { v } from "./plates";

/**
 * Live instruments for the Capabilities bento — one per feature. Each is a
 * small SVG that runs on CSS keyframes (`.bn-*` in globals.css); the grid
 * wrapper carries `.mc-plate` + `data-live`, so they only run on screen and
 * fall back to a composed still under reduced motion.
 */

const EXPO: Bezier = [0.16, 1, 0.3, 1];
const ink = (o: number) => ({ stroke: "var(--text)", strokeOpacity: o });
/** Trig differs in the last digits between Node and browsers — round so SSR hydrates cleanly. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/* 01 — Frame extraction: a strip feeds through the gate; keyframes light up. */
const STRIP = Array.from({ length: 20 }, (_, k) => bezierAt(EXPO, (k % 10) / 9));
const DELTAS = Array.from({ length: 48 }, (_, i) => {
  const t = (i % 16) / 15;
  const d = (bezierAt(EXPO, Math.min(1, t + 0.04)) - bezierAt(EXPO, t)) / 0.04;
  return Math.min(1, 0.06 + d * 0.32);
});

export function FramesInstrument() {
  return (
    <svg viewBox="0 0 640 200" className="h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <defs>
        <linearGradient id="bn-fade" x1="0" x2="1">
          <stop offset="0" stopColor="#10100e" />
          <stop offset="0.14" stopColor="#10100e" stopOpacity="0" />
          <stop offset="0.86" stopColor="#10100e" stopOpacity="0" />
          <stop offset="1" stopColor="#10100e" />
        </linearGradient>
      </defs>
      <rect x="0" y="22" width="640" height="88" fill="#0c0c0b" />
      <g className="bn-strip">
        {STRIP.map((p, k) => {
          const x = 8 + k * 82;
          return (
            <g key={k}>
              <rect x={x} y="12" width="8" height="5" rx="1" fill="var(--text)" fillOpacity="0.1" />
              <rect x={x + 40} y="12" width="8" height="5" rx="1" fill="var(--text)" fillOpacity="0.1" />
              <rect x={x} y="115" width="8" height="5" rx="1" fill="var(--text)" fillOpacity="0.1" />
              <rect x={x + 40} y="115" width="8" height="5" rx="1" fill="var(--text)" fillOpacity="0.1" />
              <rect x={x} y="30" width="72" height="72" fill="#141412" {...ink(0.14)} />
              <rect x={x + 7} y="37" width="14" height="2" fill="var(--text)" fillOpacity="0.2" />
              <rect x={x + 20} y={46 + 40 * (1 - p)} width="32" height="12" rx="2.5" fill="#26241f" {...ink(0.5)} strokeWidth="0.8" />
              {k % 10 === 0 && <circle cx={x + 64} cy="38" r="2.5" fill="var(--accent)" />}
            </g>
          );
        })}
      </g>
      <rect x="0" y="0" width="640" height="130" fill="url(#bn-fade)" />
      {/* the gate */}
      <g fill="none" stroke="var(--accent)" strokeWidth="1.5">
        <path d="M278 24 h-8 v8 M362 24 h8 v8 M278 108 h-8 v-8 M362 108 h8 v-8" />
      </g>
      <rect x="270" y="24" width="100" height="84" fill="none" stroke="var(--accent)" className="bn-gate" />
      <text x="320" y="16" textAnchor="middle" className="fill-[var(--ink-3)] font-mono text-[9px] uppercase tracking-[0.16em]">
        extract
      </text>
      {/* motion delta per frame — peaks are where the motion changes state */}
      {DELTAS.map((d, i) => {
        const x = 20 + i * 12.5;
        const key = i % 16 === 0;
        return (
          <rect
            key={i}
            x={x}
            y={186 - d * 46}
            width="6"
            height={d * 46}
            rx="1"
            fill={key ? "var(--accent)" : "var(--text)"}
            fillOpacity={key ? 0.9 : 0.16}
            className="bn-bar"
            style={v({ "--d": `${(i * 0.05).toFixed(2)}s` })}
          />
        );
      })}
      <line x1="20" x2="620" y1="186.5" y2="186.5" {...ink(0.14)} />
      <line x1="20" x2="20" y1="134" y2="190" stroke="var(--accent)" strokeOpacity="0.7" className="bn-scan" />
    </svg>
  );
}

/* 02 — Normalized spec: fields resolve one by one, deploy-list style. */
const SPEC_ROWS = [
  ["duration", "420ms"],
  ["delay", "0ms"],
  ["easing", "expo-out"],
  ["keyframes", "2 · y 148→0"],
];

function Spinner({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="6" fill="none" {...ink(0.15)} strokeWidth="1.5" />
      <g className="bn-spin">
        <circle r="6" fill="none" stroke="var(--text)" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="9.4 28.3" />
      </g>
    </g>
  );
}

export function SpecInstrument() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden>
      <text x="20" y="26" className="fill-[var(--ink-3)] font-mono text-[9px] uppercase tracking-[0.16em]">
        motion.spec
      </text>
      <text x="300" y="26" textAnchor="end" className="fill-[var(--ink-3)] font-mono text-[9px] uppercase tracking-[0.16em]">
        v1
      </text>
      {SPEC_ROWS.map(([key, value], i) => {
        const y = 44 + i * 38;
        const style = v({ "--d": `${(i * 0.45).toFixed(2)}s` });
        return (
          <g key={key}>
            <rect x="12" y={y} width="296" height="30" rx="5" fill="var(--text)" fillOpacity={0.025 + (3 - i) * 0.008} {...ink(0.08)} />
            <text x="24" y={y + 19} className="fill-[var(--ink-2)] font-mono text-[11px]">
              {key}
            </text>
            <g className="bn-pending" style={style}>
              <text x="266" y={y + 19} textAnchor="end" className="fill-[var(--ink-3)] font-mono text-[11px]">
                reading…
              </text>
              <Spinner x={287} y={y + 15} />
            </g>
            <g className="bn-done" style={style}>
              <text x="266" y={y + 19} textAnchor="end" className="fill-[var(--text)] font-mono text-[11px]">
                {value}
              </text>
              <g className="bn-pop" style={style}>
                <circle cx="287" cy={y + 15} r="7" fill="var(--accent)" />
                <path d={`M283.6 ${y + 15.2} l2.4 2.4 l4.4 -4.8`} fill="none" stroke="#10100e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

/* 03 — Multi-target: one spec, three wires, a pulse down each. */
const TARGETS = [
  { label: "CSS", y: 44 },
  { label: "GSAP", y: 100 },
  { label: "Framer", y: 156 },
];

export function TargetsInstrument() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden>
      <defs>
        <pattern id="bn-dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="0.7" fill="var(--text)" fillOpacity="0.08" />
        </pattern>
      </defs>
      <rect width="320" height="200" fill="url(#bn-dots)" />
      {TARGETS.map((t, i) => {
        const d = `M92 100 C 150 100, 160 ${t.y}, 220 ${t.y}`;
        const style = v({ "--d": `${(i * 0.35).toFixed(2)}s` });
        return (
          <g key={t.label}>
            <path d={d} fill="none" {...ink(0.16)} />
            <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" pathLength={1} className="bn-pulse" style={style} />
            <rect x="220" y={t.y - 16} width="80" height="32" rx="6" fill="#141412" {...ink(0.22)} />
            <rect x="220" y={t.y - 16} width="80" height="32" rx="6" fill="none" stroke="var(--accent)" className="bn-hit" style={style} />
            <circle cx="220" cy={t.y} r="2.5" fill="#10100e" {...ink(0.5)} />
            <text x="260" y={t.y + 4} textAnchor="middle" className="fill-[var(--text)] font-mono text-[10.5px] uppercase tracking-[0.12em]">
              {t.label}
            </text>
          </g>
        );
      })}
      <rect x="20" y="78" width="72" height="44" rx="8" fill="#26241f" {...ink(0.5)} />
      <text x="56" y="98" textAnchor="middle" className="fill-[var(--text)] font-mono text-[10px]">
        spec
      </text>
      <text x="56" y="111" textAnchor="middle" className="fill-[var(--ink-3)] font-mono text-[8px]">
        420ms
      </text>
      <circle cx="92" cy="100" r="3" fill="var(--accent)" />
    </svg>
  );
}

/* 04 — Easing detection: a confidence donut plus the candidates it beat. */
const CANDIDATES = [
  { name: "expo-out", score: 98.6, win: true },
  { name: "quart-out", score: 91.2 },
  { name: "cubic-out", score: 84.0 },
  { name: "ease-out", score: 71.5 },
];

export function EasingInstrument() {
  const R = 78;
  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="relative mx-auto aspect-square w-full max-w-[280px]">
        <svg viewBox="0 0 240 240" className="absolute inset-0 h-full w-full" aria-hidden>
          <g className="bn-rotate" style={{ transformOrigin: "120px 120px" }}>
            {Array.from({ length: 72 }, (_, i) => {
              const a = (i / 72) * Math.PI * 2;
              const r1 = 106;
              const rr = i % 6 === 0 ? 98 : 102;
              return (
                <line
                  key={i}
                  x1={r2(120 + Math.cos(a) * r1)}
                  y1={r2(120 + Math.sin(a) * r1)}
                  x2={r2(120 + Math.cos(a) * rr)}
                  y2={r2(120 + Math.sin(a) * rr)}
                  {...ink(i % 6 === 0 ? 0.35 : 0.14)}
                />
              );
            })}
          </g>
          <circle cx="120" cy="120" r="60" fill="none" {...ink(0.12)} strokeDasharray="2 5" className="bn-rotate-rev" style={{ transformOrigin: "120px 120px" }} />
          {/* the donut */}
          <circle cx="120" cy="120" r={R} fill="none" stroke="var(--text)" strokeOpacity="0.07" strokeWidth="14" />
          <g transform="rotate(-90 120 120)">
            <circle cx="120" cy="120" r={R} fill="none" stroke="var(--accent)" strokeOpacity="0.16" strokeWidth="16" pathLength={100} strokeDasharray="100" className="bn-donut" style={{ filter: "blur(5px)" }} />
            <circle cx="120" cy="120" r={R} fill="none" stroke="var(--accent)" strokeWidth="14" strokeLinecap="round" pathLength={100} strokeDasharray="100" className="bn-donut" />
          </g>
          {/* sample ticks on the ring: where the frames landed */}
          {Array.from({ length: 8 }, (_, i) => {
            const a = -Math.PI / 2 + bezierAt(EXPO, i / 7) * Math.PI * 2 * 0.986;
            return <circle key={i} cx={r2(120 + Math.cos(a) * R)} cy={r2(120 + Math.sin(a) * R)} r="2" fill="#10100e" className="bn-tick" style={v({ "--d": `${((i / 7) * 2.04).toFixed(2)}s` })} />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="bn-count font-mono text-[34px] leading-none tracking-[-0.04em] text-ink tabular-nums">.6</span>
          <span className="mt-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">% match</span>
        </div>
      </div>
      <p className="mt-4 text-center font-mono text-[10.5px] text-ink-2">
        fit <span className="text-ink">cubic-bezier(0.16, 1, 0.3, 1)</span>
      </p>
      <ul className="mt-auto space-y-2.5 px-1 pt-6 font-mono text-[10.5px]">
        {CANDIDATES.map((c, i) => (
          <li key={c.name} className="grid grid-cols-[72px_1fr_36px] items-center gap-3">
            <span className={c.win ? "text-ink" : "text-ink-3"}>{c.name}</span>
            <span className="relative h-[3px] overflow-hidden rounded-full bg-bone/[0.07]">
              <span
                className={cn("bn-bar-x absolute inset-y-0 left-0 rounded-full", c.win ? "bg-accent" : "bg-bone/30")}
                style={v({ width: `${c.score}%`, "--d": `${(0.2 + i * 0.12).toFixed(2)}s` })}
              />
            </span>
            <span className={cn("text-right tabular-nums", c.win ? "text-accent" : "text-ink-3")}>{c.score.toFixed(1)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* 05 — Workspaces: references, specs and code kept together, fanned out. */
const FILES: { name: string; curve: Bezier }[] = [
  { name: "nav-capsule.mov", curve: [0.65, 0, 0.35, 1] },
  { name: "modal-spring.gif", curve: [0.34, 1.56, 0.64, 1] },
  { name: "hero-reveal.mp4", curve: EXPO },
];

export function WorkspaceInstrument() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden>
      <text x="20" y="26" className="fill-[var(--ink-3)] font-mono text-[9px] uppercase tracking-[0.16em]">
        workspace / landing-v2
      </text>
      <circle cx="296" cy="22" r="3" fill="var(--accent)" className="animate-pulse-soft" />
      {FILES.map((f, i) => {
        const [x1, y1, x2, y2] = f.curve;
        const cx = 160;
        const style = v({ "--fx": `${(i - 1) * 78}px`, "--fr": `${(i - 1) * 7}deg`, "--d": `${(i * 0.06).toFixed(2)}s` });
        return (
          <g key={f.name} className="bn-card" style={style}>
            <rect x={cx - 64} y="52" width="128" height="120" rx="8" fill={i === 2 ? "#26241f" : "#1a1916"} {...ink(i === 2 ? 0.45 : 0.22)} />
            <rect x={cx - 52} y="64" width="104" height="64" rx="3" fill="#10100e" {...ink(0.08)} />
            <path
              d={`M${cx - 44} 120 C ${cx - 44 + 88 * x1} ${120 - 48 * y1}, ${cx - 44 + 88 * x2} ${120 - 48 * y2}, ${cx + 44} 72`}
              fill="none"
              stroke={i === 2 ? "var(--accent)" : "var(--text)"}
              strokeOpacity={i === 2 ? 1 : 0.5}
              strokeWidth="1.5"
            />
            <text x={cx - 52} y="146" className="fill-[var(--text)] font-mono text-[9px]">
              {f.name}
            </text>
            <text x={cx - 52} y="160" className="fill-[var(--ink-3)] font-mono text-[8px] uppercase tracking-[0.12em]">
              spec · css · gsap
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* 06 — Reduced motion: the same change, with and without the travel. */
export function ReducedInstrument() {
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden>
      {[
        { y: 66, label: "motion: full", cls: "bn-travel" },
        { y: 146, label: "prefers-reduced-motion", cls: "bn-swap" },
      ].map((lane) => (
        <g key={lane.label}>
          <text x="20" y={lane.y - 24} className="fill-[var(--ink-3)] font-mono text-[9px] uppercase tracking-[0.16em]">
            {lane.label}
          </text>
          <line x1="20" x2="300" y1={lane.y} y2={lane.y} {...ink(0.14)} strokeDasharray="2 4" />
          <rect x="20" y={lane.y - 12} width="24" height="24" rx="6" fill="none" {...ink(0.14)} />
          <rect x="276" y={lane.y - 12} width="24" height="24" rx="6" fill="none" {...ink(0.14)} />
          {lane.cls === "bn-travel" ? (
            <g className="bn-travel">
              <rect x="20" y={lane.y - 12} width="24" height="24" rx="6" fill="#26241f" stroke="var(--text)" strokeOpacity="0.6" />
              <circle cx="32" cy={lane.y} r="3" fill="var(--accent)" />
            </g>
          ) : (
            <>
              <g className="bn-swap-out">
                <rect x="20" y={lane.y - 12} width="24" height="24" rx="6" fill="#26241f" stroke="var(--text)" strokeOpacity="0.6" />
              </g>
              <g className="bn-swap-in">
                <rect x="276" y={lane.y - 12} width="24" height="24" rx="6" fill="#26241f" stroke="var(--text)" strokeOpacity="0.6" />
                <circle cx="288" cy={lane.y} r="3" fill="var(--accent)" />
              </g>
            </>
          )}
        </g>
      ))}
    </svg>
  );
}

export const INSTRUMENTS = [
  FramesInstrument,
  SpecInstrument,
  TargetsInstrument,
  EasingInstrument,
  WorkspaceInstrument,
  ReducedInstrument,
];
