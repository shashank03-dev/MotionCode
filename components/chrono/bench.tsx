"use client";

import * as React from "react";
import { Check, Copy, RotateCcw } from "lucide-react";

import {
  EASING_PRESETS,
  bezierAt,
  bezierPath,
  formatBezier,
  toCss,
  toFramer,
  toGsap,
  type MotionSpec,
} from "@/lib/chrono/bezier";
import { cn } from "@/lib/utils";

import { Reveal } from "./reveal";

/**
 * Plate 04 — the bench. A working miniature of the product's output stage:
 * pick a recovered curve, set a duration, and the same normalized spec is
 * re-emitted as CSS, GSAP and Framer Motion — generated live by the exact
 * functions in lib/chrono/bezier.ts, not canned snippets.
 */

const TARGETS = [
  { id: "css", label: "CSS", file: "reveal.css", emit: toCss },
  { id: "gsap", label: "GSAP", file: "reveal.js", emit: toGsap },
  { id: "framer", label: "Framer Motion", file: "Card.tsx", emit: toFramer },
] as const;

const EXPOSURES = 9;

function MiniCurve({ curve, active }: { curve: MotionSpec["curve"]; active: boolean }) {
  return (
    <svg viewBox="0 0 48 32" className="h-8 w-12" aria-hidden>
      <path
        d={bezierPath(curve, 48, 32, 3)}
        fill="none"
        stroke={active ? "var(--accent)" : "currentColor"}
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** Tiny token colouring — enough to read, nothing that fights the palette. */
function highlight(line: string) {
  const parts = line.split(/(".*?"|\/\/.*$|\/\*.*?\*\/|\b\d+(?:\.\d+)?(?:ms|px)?\b|@keyframes|@media|cubic-bezier)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (/^(\/\/|\/\*)/.test(part)) return <span key={i} className="text-ink-3">{part}</span>;
    if (/^"/.test(part)) return <span key={i} className="text-[#e8c39e]">{part}</span>;
    if (/^@|^cubic-bezier$/.test(part)) return <span key={i} className="text-accent">{part}</span>;
    if (/^\d/.test(part)) return <span key={i} className="text-ink">{part}</span>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function Bench() {
  const [presetId, setPresetId] = React.useState(EASING_PRESETS[0].id);
  const [duration, setDuration] = React.useState(420);
  const [target, setTarget] = React.useState<(typeof TARGETS)[number]["id"]>("css");
  const [run, setRun] = React.useState(0);
  const [copied, setCopied] = React.useState(false);

  const preset = EASING_PRESETS.find((p) => p.id === presetId) ?? EASING_PRESETS[0];
  const spec: MotionSpec = {
    target: ".card",
    property: "translateY",
    from: 148,
    to: 0,
    durationMs: duration,
    curve: preset.curve,
    gsapEase: preset.gsap,
  };
  const active = TARGETS.find((t) => t.id === target) ?? TARGETS[0];
  const code = active.emit(spec);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <section id="playground" className="relative border-t border-hairline py-28 sm:py-36">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <Reveal>
            <p className="eyebrow">The output</p>
            <h2 className="display-lg mt-4">
              One spec. <span className="serif-em">Every format.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-md text-[17px] leading-relaxed text-ink-2 lg:justify-self-end">
              A normalized description of the motion — then the exact same motion
              rendered as code, wherever you build. Try it: pick a curve, set a
              duration, copy the result.
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-14 grid border border-hairline-strong lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* left: the bench */}
          <div className="flex flex-col border-b border-hairline-strong lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-hairline px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
              <span>Rendered</span>
              <button
                type="button"
                onClick={() => setRun((r) => r + 1)}
                className="inline-flex min-h-[32px] items-center gap-1.5 text-ink-2 transition-colors hover:text-ink"
              >
                <RotateCcw className="size-3" aria-hidden />
                Replay
              </button>
            </div>

            {/* stage: live element + its chronophotograph */}
            <div className="relative h-[260px] overflow-hidden bg-[#0e0e0c]">
              <div className="grid-fade absolute inset-0 opacity-60" aria-hidden />
              <div className="absolute inset-y-6 left-[28%] w-px bg-hairline" aria-hidden />
              {Array.from({ length: EXPOSURES }, (_, i) => {
                const p = bezierAt(preset.curve, i / (EXPOSURES - 1));
                return (
                  <span
                    key={`${presetId}-${i}`}
                    aria-hidden
                    className="absolute left-[28%] size-11 -translate-x-1/2 rounded-[11px] border border-bone/25"
                    style={{ top: `calc(${78 - p * 56}% - 22px)`, opacity: 0.15 + (i / EXPOSURES) * 0.45 }}
                  />
                );
              })}
              <span
                key={`card-${run}-${presetId}-${duration}`}
                className="bench-card absolute left-[64%] top-[22%] flex h-[88px] w-[132px] -translate-x-1/2 flex-col justify-center gap-2 rounded-[14px] bg-accent px-4"
                style={{
                  ["--bench-ease" as string]: formatBezier(preset.curve),
                  ["--bench-dur" as string]: `${duration}ms`,
                }}
              >
                <span className="font-mono text-[11px] text-carbon">.card</span>
                <span className="h-1 w-3/4 rounded-full bg-carbon/30" />
                <span className="h-1 w-1/2 rounded-full bg-carbon/20" />
              </span>
            </div>

            {/* controls */}
            <div className="grid gap-6 border-t border-hairline p-5">
              <fieldset>
                <legend className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">Easing</legend>
                <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                  {EASING_PRESETS.map((p) => {
                    const on = p.id === presetId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => {
                          setPresetId(p.id);
                          setRun((r) => r + 1);
                        }}
                        className={cn(
                          "flex min-h-[64px] flex-col items-center justify-center gap-1 border px-1 py-2 text-ink-3 transition-colors",
                          on ? "border-accent text-ink" : "border-hairline hover:border-hairline-strong hover:text-ink-2",
                        )}
                      >
                        <MiniCurve curve={p.curve} active={on} />
                        <span className="font-mono text-[9.5px] uppercase tracking-[0.08em]">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="grid gap-3">
                <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                  Duration
                  <span className="tabular-nums text-ink">{duration}ms</span>
                </span>
                <input
                  type="range"
                  min={150}
                  max={1200}
                  step={10}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  onPointerUp={() => setRun((r) => r + 1)}
                  className="bench-range w-full"
                />
              </label>

              <dl className="grid grid-cols-2 gap-px border border-hairline bg-hairline font-mono text-[11px] sm:grid-cols-4">
                {[
                  ["Target", spec.target],
                  ["Property", "translateY"],
                  ["Duration", `${duration}ms`],
                  ["Easing", preset.label],
                ].map(([k, v]) => (
                  <div key={k} className="bg-carbon px-3 py-2.5">
                    <dt className="text-[9.5px] uppercase tracking-[0.14em] text-ink-3">{k}</dt>
                    <dd className="mt-1 truncate text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* right: the code */}
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-hairline px-2 py-1.5" role="tablist" aria-label="Export target">
              <div className="flex">
                {TARGETS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={t.id === target}
                    onClick={() => setTarget(t.id)}
                    className={cn(
                      "relative min-h-[40px] px-3 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
                      t.id === target ? "text-ink" : "text-ink-3 hover:text-ink-2",
                    )}
                  >
                    {t.label}
                    {t.id === target ? <span className="absolute inset-x-3 bottom-1 h-px bg-accent" /> : null}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={copy}
                className="inline-flex min-h-[40px] items-center gap-1.5 px-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 transition-colors hover:text-ink"
              >
                {copied ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="flex items-center gap-2 px-5 pt-4 font-mono text-[10px] tracking-[0.12em] text-ink-3">
              <span className="size-1.5 rounded-full bg-accent" />
              {active.file}
            </div>
            <pre className="min-h-[360px] flex-1 overflow-x-auto px-5 pb-6 pt-3 font-mono text-[12.5px] leading-[1.75] text-ink-2" data-lenis-prevent>
              <code>
                {code.split("\n").map((line, i) => (
                  <span key={`${target}-${i}`} className="bench-line block whitespace-pre" style={{ animationDelay: `${i * 18}ms` }}>
                    <span className="mr-5 inline-block w-5 select-none text-right text-ink-3/50">{i + 1}</span>
                    {highlight(line)}
                  </span>
                ))}
              </code>
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
