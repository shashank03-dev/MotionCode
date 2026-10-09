"use client";

import type * as React from "react";

import { FEATURES } from "@/lib/content";
import { cn } from "@/lib/utils";

import { INSTRUMENTS } from "./bento";
import { usePlateLive } from "./plates";
import { Reveal } from "./reveal";

/**
 * Capabilities as an instrument bench: a bento of hairline tiles, each with a
 * live instrument showing the feature doing its job (frames feeding a gate, a
 * spec resolving, a match-confidence donut…). Rivets mark the grid corners and
 * dashed rules run out to the page edges, like registration marks on a plate.
 *
 * Layout (lg, 12 cols): frames 8 · easing 4×2 rows / spec 4 · targets 4 /
 * workspaces 6 · reduced motion 6. Instruments only run while on screen.
 */

const LAYOUT: Record<number, { tile: string; visual: string }> = {
  0: { tile: "md:col-span-2 lg:col-span-8", visual: "h-[214px] px-2" },
  3: { tile: "md:row-span-2 lg:col-span-4 lg:row-span-2", visual: "min-h-[460px] flex-1 px-6 pb-6 pt-4" },
  1: { tile: "lg:col-span-4", visual: "h-[200px]" },
  2: { tile: "lg:col-span-4", visual: "h-[200px]" },
  4: { tile: "lg:col-span-6", visual: "h-[200px]" },
  5: { tile: "lg:col-span-6", visual: "h-[200px]" },
};
const ORDER = [0, 3, 1, 2, 4, 5];

/** Instrument readouts: what the tile is looking at, and its live state. */
const HEADERS: Record<number, [label: string, status: string, live?: boolean]> = {
  0: ["clip.mp4 · 72 frames", "extracting", true],
  1: ["motion.spec", "v1 · normalized"],
  2: ["export", "3 targets"],
  3: ["curve fit", "8 samples", true],
  4: ["workspace / landing-v2", "4 clips"],
  5: ["a11y", "fallback included"],
};

/** Cursor spotlight: feed each tile its local pointer position. */
function trackSpotlight(e: React.PointerEvent<HTMLElement>) {
  const tile = (e.target as HTMLElement).closest<HTMLElement>(".bento-tile");
  if (!tile) return;
  const r = tile.getBoundingClientRect();
  tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
  tile.style.setProperty("--my", `${e.clientY - r.top}px`);
}

function Rivet({ className }: { className: string }) {
  return <span aria-hidden className={cn("absolute z-10 size-[11px] rounded-[2px] border border-hairline-strong bg-carbon", className)} />;
}

export function Capabilities() {
  const [gridRef, live] = usePlateLive<HTMLDivElement>();
  return (
    <section id="features" className="relative overflow-x-clip py-28 sm:py-36">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-end">
          <Reveal>
            <p className="eyebrow">Capabilities</p>
            <h2 className="display-lg mt-4 max-w-[15ch]">
              Everything between a clip and <span className="serif-em">clean code</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-md text-[17px] leading-relaxed text-ink-2 lg:justify-self-end">
              MotionCode does the tedious part — reading motion frame by frame —
              so the spec you ship is precise, portable and honest to the source.
            </p>
          </Reveal>
        </div>

        <div ref={gridRef} data-live={live} className="mc-plate relative mt-16">
          {/* registration marks: rules out to the page edge, rivets at the corners */}
          <span aria-hidden className="pointer-events-none absolute -top-px left-1/2 h-px w-[200vw] -translate-x-1/2 border-t border-dashed border-hairline-strong" />
          <span aria-hidden className="pointer-events-none absolute -bottom-px left-1/2 h-px w-[200vw] -translate-x-1/2 border-t border-dashed border-hairline-strong" />
          <Rivet className="-left-[6px] -top-[6px]" />
          <Rivet className="-right-[6px] -top-[6px]" />
          <Rivet className="-bottom-[6px] -left-[6px]" />
          <Rivet className="-bottom-[6px] -right-[6px]" />

          <ol
            onPointerMove={trackSpotlight}
            className="grid grid-cols-1 gap-2 py-2 md:grid-flow-dense md:grid-cols-2 lg:grid-cols-12"
          >
            {ORDER.map((i, n) => {
              const feature = FEATURES[i];
              const Instrument = INSTRUMENTS[i];
              const layout = LAYOUT[i];
              const header = HEADERS[i];
              return (
                <li key={feature.title} data-testid="capability-card" className={cn("min-w-0", layout.tile)}>
                  <Reveal
                    delay={n * 0.05}
                    className={cn(
                      "bento-tile group relative flex h-full flex-col overflow-hidden rounded-[6px] border border-hairline-strong bg-[#10100e]",
                      "transition-[border-color,background-color] duration-500 ease-expo hover:border-bone/25 hover:bg-[#121210]",
                    )}
                  >
                    <span aria-hidden className="row-sweep pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-accent/80" />
                    <div className="relative flex items-center justify-between gap-4 px-5 pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                      <span className="truncate">{header[0]}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        {header[2] && <span className="size-1.5 animate-pulse-soft rounded-full bg-accent" />}
                        {header[1]}
                      </span>
                    </div>
                    <div className={cn("bento-dots relative transition-transform duration-700 ease-expo group-hover:scale-[1.012]", layout.visual)}>
                      <Instrument />
                    </div>
                    <div className="relative mt-auto flex flex-col gap-2 border-t border-hairline p-6 pt-5">
                      <span className="font-mono text-[11px] tabular-nums text-ink-3 transition-colors duration-500 group-hover:text-accent">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-[clamp(1.25rem,1.7vw,1.5rem)] leading-tight tracking-[-0.035em]">{feature.title}</h3>
                      <p className="max-w-md text-[14.5px] leading-relaxed text-ink-2">{feature.body}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
