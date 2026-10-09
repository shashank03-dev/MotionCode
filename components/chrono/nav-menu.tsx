"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { bezierAt } from "@/lib/chrono/bezier";
import { cn } from "@/lib/utils";

/**
 * The Product panel under "Features": the site's plates as a table of
 * contents. Each entry carries a tiny live glyph of its own plate, and the
 * right column is a working miniature — an exposure strip that re-shoots
 * while the panel is open.
 */

type Entry = { title: string; body: string; href: string; glyph: "plate" | "sequence" | "index" | "bench" | "compare" };

function entries(base: "" | "/"): { heading: string; items: Entry[] }[] {
  return [
    {
      heading: "The instrument",
      items: [
        { title: "Chronograph", body: "Bend a curve, watch it expose", href: `${base}#top`, glyph: "plate" },
        { title: "The darkroom", body: "Clip → frames → curve → code", href: `${base}#how`, glyph: "sequence" },
        { title: "Capabilities", body: "Six steps between a clip and code", href: `${base}#features`, glyph: "index" },
      ],
    },
    {
      heading: "Output",
      items: [
        { title: "Code bench", body: "CSS, GSAP and Framer, generated live", href: `${base}#playground`, glyph: "bench" },
        { title: "Compare plans", body: "Every limit, side by side", href: "/pricing#compare", glyph: "compare" },
      ],
    },
  ];
}

function MenuGlyph({ kind }: { kind: Entry["glyph"] }) {
  const box = "relative grid size-9 shrink-0 place-items-center rounded-[9px] border border-hairline bg-carbon text-ink-3 transition-colors duration-300 group-hover/item:border-hairline-strong group-hover/item:text-ink";
  switch (kind) {
    case "plate":
      return (
        <span className={box} aria-hidden>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor">
            {[3, 9, 13.5, 16.5].map((x, i) => (
              <rect key={x} x={x} y={14 - i * 2.4} width="4" height="4" rx="1" strokeOpacity={0.4 + i * 0.15} />
            ))}
            <rect x="18.5" y="5" width="4" height="4" rx="1" className="fill-accent stroke-accent" />
          </svg>
        </span>
      );
    case "sequence":
      return (
        <span className={box} aria-hidden>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor">
            <rect x="3" y="5" width="7" height="6" rx="1" />
            <rect x="14" y="5" width="7" height="6" rx="1" strokeOpacity="0.5" />
            <path d="M3 20 C 8 20, 9 14, 21 14" className="menu-draw" pathLength={1} />
          </svg>
        </span>
      );
    case "index":
      return (
        <span className={box} aria-hidden>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor">
            {[6, 12, 18].map((y, i) => (
              <g key={y}>
                <line x1="3" x2="6" y1={y} y2={y} strokeOpacity="0.5" />
                <line x1="9" x2={21 - i * 3} y1={y} y2={y} />
              </g>
            ))}
          </svg>
        </span>
      );
    case "bench":
      return (
        <span className={box} aria-hidden>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor">
            <path d="M8 7 L3 12 L8 17 M16 7 L21 12 L16 17" />
            <line x1="13.5" x2="10.5" y1="5" y2="19" className="stroke-accent" />
          </svg>
        </span>
      );
    case "compare":
      return (
        <span className={box} aria-hidden>
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor">
            {[5, 11, 17].map((x, i) => (
              <rect key={x} x={x} y={18 - (i + 1) * 4} width="3" height={(i + 1) * 4} rx="0.5" strokeOpacity={0.45 + i * 0.25} />
            ))}
          </svg>
        </span>
      );
  }
}

function LiveStrip() {
  const n = 9;
  return (
    <div className="relative h-8" aria-hidden>
      <span className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
      {Array.from({ length: n }, (_, i) => {
        const t = i / (n - 1);
        const head = i === n - 1;
        return (
          <span
            key={i}
            className={cn(
              "menu-sample absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[3px]",
              head ? "bg-accent" : "border border-bone/40 bg-carbon",
            )}
            style={{
              left: `${bezierAt([0.16, 1, 0.3, 1], t) * 100}%`,
              ["--o" as string]: head ? 1 : 0.3 + t * 0.6,
              animationDelay: `${i * 60}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

export const ProductPanel = React.forwardRef<
  HTMLDivElement,
  {
    id: string;
    base: "" | "/";
    onNavigate: () => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
  }
>(function ProductPanel({ id, base, onNavigate, onPointerEnter, onPointerLeave }, ref) {
  return (
    <div
      ref={ref}
      id={id}
      role="region"
      aria-label="Product"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      className="nav-panel absolute left-1/2 top-[calc(100%+10px)] z-50 w-[min(880px,calc(100vw-48px))] -translate-x-1/2 overflow-hidden rounded-[16px] border border-hairline-strong bg-[#10100e] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_15rem]">
        {entries(base).map((col) => (
          <div key={col.heading} className="p-3">
            <p className="px-3 pb-2 pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{col.heading}</p>
            <ul>
              {col.items.map((item) => (
                <li key={item.title}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className="group/item flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors duration-200 hover:bg-bone/[0.04] focus-visible:bg-bone/[0.04]"
                  >
                    <MenuGlyph kind={item.glyph} />
                    <span className="min-w-0">
                      <span className="block text-[14px] text-ink">{item.title}</span>
                      <span className="block truncate text-[12.5px] text-ink-3 transition-colors group-hover/item:text-ink-2">
                        {item.body}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="flex flex-col justify-between border-l border-hairline bg-bone/[0.02] p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">Plate · live</p>
            <LiveStrip />
            <p className="mt-3 text-[13px] leading-snug text-ink-2">
              One element, exposed nine times. The spacing <span className="serif-em text-ink">is</span> the curve.
            </p>
          </div>
          <Link
            href="/app"
            onClick={onNavigate}
            className="group/cta mt-5 inline-flex items-center justify-between rounded-[10px] bg-accent px-3.5 py-2.5 text-[13.5px] font-medium text-carbon transition-colors hover:bg-bone"
          >
            Open the analyzer
            <ArrowRight className="size-4 transition-transform duration-500 ease-expo group-hover/cta:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>

      <Link
        href={`${base}#playground`}
        onClick={onNavigate}
        className="group/new flex items-center justify-between border-t border-hairline px-6 py-3 text-[13px] transition-colors hover:bg-bone/[0.03]"
      >
        <span className="flex items-center gap-3">
          <span className="rounded-[4px] border border-accent/50 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-accent">
            New
          </span>
          <span className="text-ink-2">
            The code bench — pick a curve, copy production code
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-ink-3 transition-colors group-hover/new:text-ink">
          Try it <ArrowUpRight className="size-3.5" aria-hidden />
        </span>
      </Link>
    </div>
  );
});
