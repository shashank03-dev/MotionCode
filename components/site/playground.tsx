"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { MoveHorizontal } from "lucide-react";
import { Reveal } from "@/components/motion/scroll-reveal";

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

export function Playground() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const raw = useMotionValue(0.15);
  const t = useSpring(raw, { stiffness: 220, damping: 26 });
  const [pct, setPct] = React.useState(15);

  const left = useTransform(t, (v) => `${8 + smoothstep(v) * 84}%`);
  const thumbLeft = useTransform(t, (v) => `${v * 100}%`);

  function setFromEvent(clientX: number) {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const v = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    raw.set(v);
    setPct(Math.round(v * 100));
  }

  return (
    <section id="playground" className="container-page scroll-mt-24 py-16">
      <Reveal className="overflow-hidden rounded-3xl border border-hairline bg-panel/50 p-5 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-3">Playground</div>
            <h2 className="text-3xl tracking-tight sm:text-4xl">
              Scrub the motion yourself
            </h2>
            <p className="mt-3 max-w-md text-ink-2">
              Drag across the timeline — the element follows the recovered easing,
              not a straight line.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-[12px] text-ink-3">
            <MoveHorizontal className="h-4 w-4 text-accent" />
            progress {pct}%
          </div>
        </div>

        {/* stage */}
        <div className="relative mt-8 h-28 overflow-hidden rounded-xl border border-hairline bg-black/50">
          <div className="absolute inset-0 grid-fade opacity-40" />
          <motion.div
            style={{ left }}
            className="absolute top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-[0_0_28px_var(--accent-glow)]"
          />
        </div>

        {/* scrub track */}
        <div
          ref={trackRef}
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
            setFromEvent(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) setFromEvent(e.clientX);
          }}
          onMouseMove={(e) => setFromEvent(e.clientX)}
          className="relative mt-5 h-10 cursor-ew-resize touch-none max-sm:h-11 max-sm:min-h-[44px]"
        >
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-hairline" />
          <motion.div
            style={{ width: thumbLeft }}
            className="absolute left-0 top-1/2 h-px -translate-y-1/2 bg-accent"
          />
          <motion.div
            style={{ left: thumbLeft }}
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--accent-border)] bg-black shadow-glow after:absolute after:-inset-[14px] after:content-['']"
          />
        </div>
      </Reveal>
    </section>
  );
}
