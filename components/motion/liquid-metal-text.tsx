"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
  /** footer mode: sheen tracks the cursor, warp deepens on hover */
  interactive?: boolean;
  /** idle displacement scale (px) */
  displace?: number;
};

/**
 * Liquid-chrome text. Real (selectable, accessible) HTML text filled with a
 * steel-blue metallic gradient, warped by an SVG turbulence/displacement filter
 * for the "liquid metal" ripple. Motion is the travelling sheen (CSS), so it
 * respects prefers-reduced-motion automatically.
 */
export function LiquidMetalText({
  text,
  className,
  interactive = false,
  displace = 1.4,
}: Props) {
  const rawId = React.useId();
  const fid = `lm-${rawId.replace(/[:]/g, "")}`;
  const ref = React.useRef<HTMLSpanElement>(null);
  const [hover, setHover] = React.useState(false);

  const onMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!interactive) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 240; // maps into 240% bg
      el.style.setProperty("--lm-x", `${x}%`);
    },
    [interactive],
  );

  const scale = interactive && hover ? displace * 2.2 : displace;

  return (
    <span
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={interactive ? () => setHover(true) : undefined}
      onMouseLeave={
        interactive
          ? () => {
              setHover(false);
              ref.current?.style.setProperty("--lm-x", "50%");
            }
          : undefined
      }
      className={cn("lm-text", interactive && "lm-interactive", className)}
      style={{
        filter: `url(#${fid}) drop-shadow(0 1px 9px rgba(150,180,225,0.11))`,
      }}
    >
      {text}
      <svg
        width="0"
        height="0"
        aria-hidden
        style={{ position: "absolute", pointerEvents: "none" }}
      >
        <filter id={fid} x="-15%" y="-40%" width="130%" height="180%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.004 0.006"
            numOctaves={2}
            seed={7}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </span>
  );
}
