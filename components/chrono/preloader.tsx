"use client";

import * as React from "react";

import { bezierAt } from "@/lib/chrono/bezier";

/**
 * First-visit intro: a single exposure being taken. Nine strobe samples of the
 * mark travel across the frame on the house curve while the counter runs, then
 * the shutter lifts (clip-path wipe, see `.mc-preloader` in globals.css).
 *
 * Shown only when the pre-paint gate (lib/intro-gate.ts) stamped
 * `data-intro="play"`; otherwise the overlay is `display:none` from the first
 * frame. JS only decides *when* to lift — the animation is CSS, and a CSS
 * failsafe clears the overlay at 2.5s even if this never hydrates.
 */
const HOLD_MS = 1150;
const SAMPLES = 9;

export function Preloader() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [gone, setGone] = React.useState(false);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root || document.documentElement.dataset.intro !== "play") {
      setGone(true);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lift = window.setTimeout(() => {
      root.dataset.state = "leaving";
    }, reduce ? 350 : HOLD_MS);
    const remove = window.setTimeout(() => setGone(true), (reduce ? 350 : HOLD_MS) + 800);
    return () => {
      window.clearTimeout(lift);
      window.clearTimeout(remove);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      className="mc-preloader"
      role="status"
      aria-live="polite"
      aria-label="Loading MotionCode"
    >
      <div className="relative w-[min(78vw,640px)]" aria-hidden>
        <div className="relative h-14">
          <span className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
          {Array.from({ length: SAMPLES }, (_, i) => {
            const x = bezierAt([0.16, 1, 0.3, 1], i / (SAMPLES - 1)) * 100;
            const last = i === SAMPLES - 1;
            return (
              <span
                key={i}
                className="preloader-sample absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-[8px]"
                style={{
                  left: `${x}%`,
                  animationDelay: `${120 + i * 70}ms`,
                  background: last ? "var(--accent)" : "transparent",
                  border: last ? "none" : "1px solid rgba(237,235,228,0.35)",
                  ["--o" as string]: last ? 1 : 0.25 + (i / SAMPLES) * 0.6,
                }}
              />
            );
          })}
        </div>
        <div className="mt-8 flex items-end justify-between">
          <span className="text-[28px] font-medium tracking-[-0.04em] text-ink">
            Motion<span className="serif-em">Code</span>
          </span>
          <span className="preloader-count font-mono text-[11px] tabular-nums tracking-[0.12em] text-ink-3" />
        </div>
      </div>
    </div>
  );
}
