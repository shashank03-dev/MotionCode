"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Filmstrip } from "@/components/motion/filmstrip";
import { MotionCurve } from "@/components/motion/motion-curve";
import { Badge } from "@/components/ui/badge";

export function ArtifactPanel() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, rotateX: 6 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1], delay: 0.25 }}
      style={{ perspective: 1200 }}
      className="relative w-full"
    >
      <div className="glass-card rounded-2xl p-3 shadow-lift">
        {/* header */}
        <div className="mb-3 flex items-center justify-between px-1">
          <span className="font-mono text-[11px] tracking-wide text-ink-3">
            reference.mp4
          </span>
          <Badge dot>Analyzing</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1.15fr_1fr]">
          {/* reference viewport with extraction scanline */}
          <div className="relative overflow-hidden rounded-xl border border-hairline bg-black">
            <div className="absolute inset-0 grid-fade opacity-50" />
            {/* the moving element being referenced */}
            <motion.div
              className="absolute left-1/2 h-8 w-8 -translate-x-1/2 rounded-lg bg-white shadow-[0_0_24px_var(--accent-glow)]"
              initial={{ top: "62%" }}
              animate={reduce ? { top: "30%" } : { top: ["62%", "22%", "62%"] }}
              transition={{
                duration: 2.6,
                ease: [0.2, 0.8, 0.2, 1],
                repeat: reduce ? 0 : Infinity,
              }}
            />
            {/* extraction scanline */}
            {!reduce && (
              <motion.div
                className="absolute inset-x-0 h-px bg-accent shadow-[0_0_12px_2px_var(--accent-glow)]"
                initial={{ top: "0%" }}
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 2.2, ease: "linear", repeat: Infinity }}
              />
            )}
            <div className="relative flex aspect-video items-end p-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                input · 60fps
              </span>
            </div>
          </div>

          {/* recovered easing curve */}
          <div className="relative rounded-xl border border-hairline bg-black/50 p-2">
            <MotionCurve className="h-full min-h-[150px] w-full" />
          </div>
        </div>

        {/* extracted frames */}
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
              extracted frames
            </span>
            <span className="font-mono text-[10px] text-ink-3">6 / 6</span>
          </div>
          <Filmstrip frames={6} />
        </div>

        {/* spec readout */}
        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
          {[
            { k: "duration", v: "420ms" },
            { k: "easing", v: "expo-out" },
            { k: "distance", v: "148px" },
          ].map((s) => (
            <div
              key={s.k}
              className="rounded-lg border border-hairline bg-black/40 px-3 py-2 sm:p-3"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3 max-sm:text-[11px]">
                {s.k}
              </div>
              <div className="font-mono text-[13px] text-ink">{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ambient glow under the panel */}
      <div className="absolute inset-x-8 -bottom-6 -z-10 h-24 accent-underglow blur-2xl" />
    </motion.div>
  );
}
