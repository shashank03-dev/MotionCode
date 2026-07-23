"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useAnimationFrame,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  /** cubic-bezier control points, normalized 0..1 */
  bezier?: [number, number, number, number];
  className?: string;
  label?: string;
  /** loop a dot travelling along the curve */
  animate?: boolean;
};

/** Cubic-bezier point at parameter t (geometric, P0=(0,0) P3=(1,1)). */
function cubic(t: number, p1: number, p2: number) {
  const mt = 1 - t;
  return 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t;
}

export function MotionCurve({
  bezier = [0.2, 0.8, 0.2, 1],
  className,
  label = "cubic-bezier(.2,.8,.2,1)",
  animate = true,
}: Props) {
  const reduce = useReducedMotion();
  const [x1, y1, x2, y2] = bezier;
  const W = 220;
  const H = 160;
  const pad = 18;
  const iw = W - pad * 2;
  const ih = H - pad * 2;

  // Map normalized (progress, value) → screen px (value axis points up).
  const sx = (v: number) => pad + v * iw;
  const sy = (v: number) => pad + (1 - v) * ih;

  const path = `M ${sx(0)} ${sy(0)} C ${sx(x1)} ${sy(y1)} ${sx(x2)} ${sy(y2)} ${sx(1)} ${sy(1)}`;

  const dotX = useMotionValue(sx(0));
  const dotY = useMotionValue(sy(0));
  const t0 = React.useRef<number | null>(null);

  useAnimationFrame((time) => {
    if (reduce || !animate) {
      dotX.set(sx(1));
      dotY.set(sy(1));
      return;
    }
    if (t0.current == null) t0.current = time;
    const period = 2600;
    const t = ((time - t0.current) % period) / period;
    // progress along x is t; value follows the easing curve
    dotX.set(sx(t));
    dotY.set(sy(cubic(t, y1, y2)));
  });

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-full w-full"
        role="img"
        aria-label={`Easing curve ${label}`}
      >
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g} stroke="rgba(255,255,255,0.06)" strokeWidth={1}>
            <line x1={sx(g)} y1={sy(0)} x2={sx(g)} y2={sy(1)} />
            <line x1={sx(0)} y1={sy(g)} x2={sx(1)} y2={sy(g)} />
          </g>
        ))}
        {/* diagonal linear reference */}
        <line
          x1={sx(0)}
          y1={sy(0)}
          x2={sx(1)}
          y2={sy(1)}
          stroke="rgba(255,255,255,0.14)"
          strokeDasharray="3 4"
          strokeWidth={1}
        />
        {/* control handles */}
        <g stroke="var(--accent)" strokeOpacity={0.4} strokeWidth={1}>
          <line x1={sx(0)} y1={sy(0)} x2={sx(x1)} y2={sy(y1)} />
          <line x1={sx(1)} y1={sy(1)} x2={sx(x2)} y2={sy(y2)} />
        </g>
        <circle cx={sx(x1)} cy={sy(y1)} r={2.5} fill="var(--accent)" fillOpacity={0.6} />
        <circle cx={sx(x2)} cy={sy(y2)} r={2.5} fill="var(--accent)" fillOpacity={0.6} />
        {/* the curve, drawn on when revealed */}
        <motion.path
          d={path}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ filter: "drop-shadow(0 0 6px var(--accent-glow))" }}
        />
        {/* travelling dot */}
        <motion.circle
          cx={dotX}
          cy={dotY}
          r={4}
          fill="#fff"
          style={{ filter: "drop-shadow(0 0 6px var(--accent))" }}
        />
      </svg>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
        {label}
      </span>
    </div>
  );
}
