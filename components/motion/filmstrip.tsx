"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A strip of extracted frames. Each frame shows the tracked element at a
 * progressive position (eased), evoking motion-capture sampling.
 */
export function Filmstrip({
  frames = 6,
  className,
  active,
}: {
  frames?: number;
  className?: string;
  active?: number; // index to emphasise; if undefined, cycles
}) {
  const reduce = useReducedMotion();
  const [cycle, setCycle] = React.useState(0);

  React.useEffect(() => {
    if (reduce || active != null) return;
    const id = setInterval(() => setCycle((c) => (c + 1) % frames), 520);
    return () => clearInterval(id);
  }, [frames, reduce, active]);

  const current = active ?? cycle;

  return (
    <div className={cn("flex items-stretch gap-2", className)}>
      {Array.from({ length: frames }).map((_, i) => {
        const t = i / (frames - 1);
        // eased vertical position of the tracked element within the frame
        const ease = t * t * (3 - 2 * t); // smoothstep
        const isActive = i === current;
        return (
          <div
            key={i}
            className={cn(
              "relative flex-1 overflow-hidden rounded-md border bg-black/60 transition-colors duration-300",
              isActive ? "border-[var(--accent-border)]" : "border-hairline",
            )}
            style={{ aspectRatio: "3 / 4" }}
          >
            {/* subtle frame grid */}
            <div className="absolute inset-0 grid-fade opacity-40" />
            {/* tracked element */}
            <motion.span
              className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-[3px]"
              style={{
                top: `${12 + ease * 64}%`,
                background: isActive ? "var(--accent)" : "rgba(255,255,255,0.5)",
                boxShadow: isActive ? "0 0 10px var(--accent-glow)" : "none",
              }}
            />
            {/* frame index */}
            <span className="absolute bottom-1 left-1.5 font-mono text-[8px] tracking-wide text-ink-3">
              {String(i + 1).padStart(2, "0")}
            </span>
            {isActive && (
              <motion.span
                layoutId="filmstrip-active"
                className="absolute inset-0 rounded-md shadow-[inset_0_0_0_1px_var(--accent-border)]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
