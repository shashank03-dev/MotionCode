import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  dot = false,
}: {
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 shadow-ring",
        className,
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-accent" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
      )}
      {children}
    </span>
  );
}
