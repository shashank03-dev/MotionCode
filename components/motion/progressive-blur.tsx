"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ProgressiveBlur — the iOS-style gradient blur. A single backdrop-filter can
 * only apply one uniform blur radius, so we stack several absolutely-positioned
 * layers, each blurring more than the last and each masked to a narrow band by a
 * linear-gradient. Where the bands overlap the eye reads a smooth easing from a
 * strong blur at the edge to zero blur where the content should stay crisp.
 */

type Side = "top" | "bottom";

type Props = {
  side: Side;
  /** blur band height, any CSS length */
  height?: string;
  /** maximum blur radius in px at the edge */
  strength?: number;
  /** number of easing layers (more = smoother, slightly heavier) */
  layers?: number;
  /** pin to the viewport instead of the nearest positioned ancestor */
  fixed?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

export function ProgressiveBlur({
  side,
  height = "140px",
  strength = 14,
  layers = 6,
  fixed = false,
  className,
  style,
}: Props) {
  const items = React.useMemo(() => {
    const out: React.CSSProperties[] = [];
    for (let i = 0; i < layers; i++) {
      const t = (i + 1) / layers; // 0→1 across layers
      const blur = +(strength * t * t).toFixed(2);
      // band that this layer reveals — later layers sit closer to the edge
      const from = i / layers;
      const to = (i + 2) / layers;
      const a = (from * 100).toFixed(1);
      const b = (Math.min(1, to) * 100).toFixed(1);
      // gradient runs from the crisp inner edge toward the blurred outer edge
      const dir = side === "top" ? "to top" : "to bottom";
      const mask = `linear-gradient(${dir}, transparent ${a}%, #000 ${b}%)`;
      out.push({
        position: "absolute",
        inset: 0,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        WebkitMaskImage: mask,
        maskImage: mask,
      });
    }
    return out;
  }, [side, strength, layers]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none inset-x-0 z-40",
        fixed ? "fixed" : "absolute",
        className,
      )}
      style={{
        height,
        [side]: 0,
        ...style,
      }}
    >
      {items.map((s, i) => (
        <div key={i} style={s} />
      ))}
    </div>
  );
}
