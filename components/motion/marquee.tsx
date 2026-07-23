"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Seamless horizontal marquee. Duplicates content and translates -50%. */
export function Marquee({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]",
        className,
      )}
    >
      {[0, 1].map((dup) => (
        <div
          key={dup}
          aria-hidden={dup === 1}
          className="flex shrink-0 animate-marquee items-center gap-14 pr-14 group-hover:[animation-play-state:paused]"
        >
          {items.map((item, i) => (
            <span
              key={`${dup}-${i}`}
              className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.22em] text-ink-3"
            >
              <span className="h-1 w-1 rounded-full bg-accent/60" />
              {item}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
