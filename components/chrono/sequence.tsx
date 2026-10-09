"use client";

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { STEPS } from "@/lib/content";
import { bezierAt, bezierPath, formatBezier, toCss, type Bezier } from "@/lib/chrono/bezier";
import { cn } from "@/lib/utils";

/**
 * "How it works" as one continuous darkroom process, scrubbed by scroll:
 *
 *   01 Reference — a live clip plays in the viewfinder.
 *   02 Analyze   — the clip is cut into a contact sheet of frames; each frame's
 *                  element position becomes a dot; the dots resolve into the
 *                  easing curve (a Marey plot).
 *   03 Ship      — the curve docks and the spec is transcribed into code.
 *
 * Desktop with motion: a sticky stage driven by a ScrollTrigger timeline.
 * Small screens and reduced motion: a static, stacked version of each act.
 */

const CURVE: Bezier = [0.16, 1, 0.3, 1];
const FRAMES = 8;
const SAMPLES = Array.from({ length: FRAMES }, (_, i) => bezierAt(CURVE, i / (FRAMES - 1)));
const CODE = toCss({
  target: ".card",
  property: "translateY",
  from: 148,
  to: 0,
  durationMs: 420,
  curve: CURVE,
}).split("\n");

/** A mock interface frame: a card mid-flight at progress `p`. */
function FrameArt({ p, live = false }: { p: number; live?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#10100e]">
      <div className="absolute inset-x-[8%] top-[8%] flex items-center gap-[2%]">
        <span className="h-[3px] w-[10%] rounded-full bg-bone/20" />
        <span className="h-[3px] w-[6%] rounded-full bg-bone/10" />
        <span className="ml-auto h-[3px] w-[8%] rounded-full bg-bone/10" />
      </div>
      <div
        className={cn(
          "absolute left-1/2 w-[34%] -translate-x-1/2 rounded-[6%/9%] border border-bone/50 bg-[#26241f] p-[3%] shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)]",
          live && "seq-live-card",
        )}
        style={live ? undefined : { top: `${66 - p * 40}%`, opacity: 0.35 + p * 0.65 }}
      >
        <span className="block h-[5px] w-[60%] rounded-full bg-bone/70" />
        <span className="mt-[6%] block h-[4px] w-[85%] rounded-full bg-bone/15" />
        <span className="mt-[4%] block h-[4px] w-[70%] rounded-full bg-bone/15" />
      </div>
    </div>
  );
}

/** Camera chrome over the live clip: corner marks, centre cross, timecode. */
function Viewfinder() {
  const corner = "absolute size-5 border-bone/50";
  return (
    <div className="pointer-events-none absolute inset-[4%]" aria-hidden>
      <span className={cn(corner, "left-0 top-0 border-l border-t")} />
      <span className={cn(corner, "right-0 top-0 border-r border-t")} />
      <span className={cn(corner, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(corner, "bottom-0 right-0 border-b border-r")} />
      <span className="absolute left-1/2 top-1/2 h-4 w-px -translate-x-1/2 -translate-y-1/2 bg-bone/30" />
      <span className="absolute left-1/2 top-1/2 h-px w-4 -translate-x-1/2 -translate-y-1/2 bg-bone/30" />
      <span className="viewfinder-tc absolute bottom-1 right-2 font-mono text-[10px] tabular-nums tracking-[0.1em] text-ink-2" />
    </div>
  );
}

function Plot({ className, drawn = true }: { className?: string; drawn?: boolean }) {
  const W = 400;
  const H = 260;
  const P = 24;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("overflow-visible", className)} aria-hidden>
      <g stroke="var(--border)">
        {[0.25, 0.5, 0.75].map((v) => (
          <line key={`h${v}`} x1={P} x2={W - P} y1={P + v * (H - 2 * P)} y2={P + v * (H - 2 * P)} />
        ))}
        {Array.from({ length: FRAMES }, (_, i) => (
          <line
            key={`v${i}`}
            x1={P + (i / (FRAMES - 1)) * (W - 2 * P)}
            x2={P + (i / (FRAMES - 1)) * (W - 2 * P)}
            y1={P}
            y2={H - P}
            strokeDasharray="2 4"
          />
        ))}
      </g>
      <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="none" stroke="var(--border-strong)" />
      <path
        data-seq="curve"
        d={bezierPath(CURVE, W, H, P)}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={drawn ? 0 : 1}
      />
      {SAMPLES.map((y, i) => (
        <g key={i} data-seq="dot">
          <circle
            cx={P + (i / (FRAMES - 1)) * (W - 2 * P)}
            cy={H - P - y * (H - 2 * P)}
            r="4.5"
            fill="var(--carbon)"
            stroke="var(--text)"
            strokeWidth="1.5"
          />
        </g>
      ))}
      <text x={P} y={H - 6} className="fill-[var(--ink-3)] font-mono text-[10px]">
        t
      </text>
      <text x={W - P} y={14} textAnchor="end" className="fill-[var(--ink-3)] font-mono text-[10px]">
        {formatBezier(CURVE)}
      </text>
    </svg>
  );
}

function CodeBlock({ className }: { className?: string }) {
  return (
    <pre
      className={cn(
        "overflow-x-auto border border-hairline bg-carbon/90 p-5 font-mono text-[12.5px] leading-[1.7] text-ink-2",
        className,
      )}
    >
      <code>
        {CODE.map((line, i) => (
          <span key={i} data-seq="line" className="block whitespace-pre">
            <span className="mr-4 inline-block w-5 select-none text-right text-ink-3/60">{i + 1}</span>
            <span className={cn(/cubic-bezier|420ms/.test(line) && "text-ink")}>{line || " "}</span>
          </span>
        ))}
      </code>
    </pre>
  );
}

const GRID = Array.from({ length: FRAMES }, (_, i) => {
  const c = i % 4;
  const r = Math.floor(i / 4);
  return { left: 1 + c * 24.75, top: 14 + r * 38, w: 23.5 };
});

function PinnedSequence() {
  const root = React.useRef<HTMLElement>(null);
  const [active, setActive] = React.useState(0);

  React.useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const q = gsap.utils.selector(el);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.7,
          onUpdate: (self) => {
            const p = self.progress;
            setActive(p < 0.3 ? 0 : p < 0.66 ? 1 : 2);
          },
        },
      });

      // Act 1 → 2: the clip is cut into frames.
      tl.to(q("[data-seq='live']"), { opacity: 0, duration: 0.06 }, 0.2)
        .to(q("[data-seq='rec']"), { opacity: 0, duration: 0.04 }, 0.2)
        .set(q("[data-seq='frame']"), { opacity: 1 }, 0.2);
      q("[data-seq='frame']").forEach((frame, i) => {
        const g = GRID[i];
        tl.to(
          frame,
          {
            left: `${g.left}%`,
            top: `${g.top}%`,
            width: `${g.w}%`,
            height: `${g.w}%`,
            duration: 0.14,
            ease: "power3.inOut",
          },
          0.22 + i * 0.008,
        );
      });
      tl.to(q("[data-seq='frame-label']"), { opacity: 1, duration: 0.04, stagger: 0.004 }, 0.34);

      // Act 2: frames become samples, samples become a curve.
      tl.to(q("[data-seq='frame']"), { opacity: 0.12, duration: 0.08 }, 0.44)
        .fromTo(q("[data-seq='plot']"), { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.44)
        .fromTo(
          q("[data-seq='dot']"),
          { opacity: 0, scale: 0, transformOrigin: "center", transformBox: "fill-box" },
          { opacity: 1, scale: 1, duration: 0.03, stagger: 0.012 },
          0.46,
        )
        .fromTo(q("[data-seq='curve']"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.12 }, 0.52);

      // Act 3: dock the plot, transcribe the code.
      tl.to(q("[data-seq='frame']"), { opacity: 0, duration: 0.04 }, 0.66)
        .to(q("[data-seq='plot']"), { width: "40%", duration: 0.1, ease: "power3.inOut" }, 0.66)
        .fromTo(q("[data-seq='code']"), { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.08 }, 0.7)
        .fromTo(
          q("[data-seq='line']"),
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", duration: 0.02, stagger: 0.012 },
          0.74,
        )
        .fromTo(q("[data-seq='chips'] > *"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.03, stagger: 0.015 }, 0.9);

      // Playhead + timecode across the whole reel.
      tl.fromTo(q("[data-seq='playhead']"), { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} data-how-pinned className="relative" style={{ height: "420vh" }}>
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden pt-16">
        <div className="container-page flex items-end justify-between gap-6 pt-8">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="display-md mt-3">
              From reference to shipped, <span className="serif-em">in one pass</span>
            </h2>
          </div>
          <p className="hidden font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 xl:block">
            Plate 02 — the darkroom
          </p>
        </div>

        <div className="container-page grid flex-1 grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] items-center gap-12 py-8">
          {/* step captions */}
          <ol className="relative h-[260px]">
            {STEPS.map((step, i) => (
              <li
                key={step.kicker}
                className={cn(
                  "absolute inset-x-0 top-0 transition-[opacity,transform] duration-700 ease-expo",
                  i === active ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0",
                )}
              >
                <p className="font-mono text-[12px] tracking-[0.12em] text-accent">{step.kicker}</p>
                <h3 className="mt-4 text-[clamp(1.8rem,2.6vw,2.6rem)] leading-[1.02] tracking-[-0.04em]">
                  {step.title}
                </h3>
                <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-ink-2">{step.body}</p>
              </li>
            ))}
            <li aria-hidden className="absolute bottom-0 left-0 flex gap-2">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-px transition-all duration-700 ease-expo",
                    i === active ? "w-12 bg-accent" : "w-6 bg-hairline-strong",
                  )}
                />
              ))}
            </li>
          </ol>

          {/* the stage */}
          <div className="relative mx-auto aspect-[3/2] w-full max-w-[780px]">
            {Array.from({ length: FRAMES }, (_, i) => (
              <div
                key={i}
                data-seq="frame"
                className="absolute overflow-hidden border border-hairline-strong"
                style={{ left: 0, top: 0, width: "100%", height: "100%", opacity: i === 0 ? 1 : 0, zIndex: FRAMES - i }}
              >
                <FrameArt p={SAMPLES[i]} />
                <span
                  data-seq="frame-label"
                  className="absolute bottom-1.5 left-2 font-mono text-[9px] tracking-[0.1em] text-ink-3 opacity-0"
                >
                  F{String(i * 3).padStart(2, "0")}
                </span>
              </div>
            ))}
            <div data-seq="live" className="absolute inset-0 z-20 border border-hairline-strong">
              <FrameArt p={0} live />
              <Viewfinder />
            </div>
            <div
              data-seq="rec"
              className="absolute left-3 top-3 z-30 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2"
            >
              <span className="size-1.5 animate-pulse-soft rounded-full bg-accent" />
              reference.mp4 · rec
            </div>

            <div data-seq="plot" className="absolute inset-y-0 left-0 z-30 flex w-full items-center justify-center opacity-0">
              <Plot className="h-full w-full" drawn={false} />
            </div>

            <div data-seq="code" className="absolute inset-y-0 right-0 z-40 flex w-[56%] flex-col justify-center gap-4 opacity-0">
              <CodeBlock />
              <div data-seq="chips" className="flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                {["420ms", "expo-out", "translateY 148→0", "reduced-motion ✓"].map((chip) => (
                  <span key={chip} className="border border-hairline-strong px-2.5 py-1 text-ink-2">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="absolute -bottom-8 inset-x-0 h-px bg-hairline">
              <span data-seq="playhead" className="absolute inset-0 origin-left bg-accent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StackedSequence() {
  return (
    <section data-how-stacked className="container-page py-24">
      <p className="eyebrow">How it works</p>
      <h2 className="display-md mt-3">From reference to shipped</h2>
      <ol className="mt-14 grid grid-cols-1 gap-16">
        {STEPS.map((step, i) => (
          <li
            key={step.kicker}
            className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 md:items-center md:gap-10 [&>*]:min-w-0"
          >
            <div>
              <p className="font-mono text-[12px] tracking-[0.12em] text-accent">{step.kicker}</p>
              <h3 className="mt-3 text-3xl tracking-[-0.04em]">{step.title}</h3>
              <p className="mt-3 max-w-md text-ink-2">{step.body}</p>
            </div>
            <div className="relative">
              {i === 0 ? (
                <div className="relative aspect-[3/2] border border-hairline-strong">
                  <FrameArt p={0} live />
                </div>
              ) : i === 1 ? (
                <div className="grid grid-cols-4 gap-1.5">
                  {SAMPLES.map((p, f) => (
                    <div key={f} className="relative aspect-square border border-hairline">
                      <FrameArt p={p} />
                    </div>
                  ))}
                  <div className="col-span-4 mt-3 border border-hairline p-2">
                    <Plot className="h-auto w-full" />
                  </div>
                </div>
              ) : (
                <CodeBlock className="text-[11.5px]" />
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Sequence() {
  // The anchor wraps both variants so #how resolves at every breakpoint.
  return (
    <div id="how" className="relative">
      <div className="seq-pinned hidden lg:block">
        <PinnedSequence />
      </div>
      <div className="seq-stacked lg:hidden">
        <StackedSequence />
      </div>
    </div>
  );
}
