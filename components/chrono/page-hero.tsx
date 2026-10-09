import type { ReactNode } from "react";

import { bezierAt } from "@/lib/chrono/bezier";
import { cn } from "@/lib/utils";

/**
 * Header plate for every secondary marketing page (pricing, support, legal,
 * 404): mono kicker, display title, lede, and a thin exposure strip — the
 * site's signature reduced to a rule.
 */
export function ExposureRule({ className, count = 11 }: { className?: string; count?: number }) {
  return (
    <div className={cn("relative h-6", className)} aria-hidden>
      <span className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
      {Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1);
        const last = i === count - 1;
        return (
          <span
            key={i}
            className={cn(
              "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-[3px]",
              last ? "bg-accent" : "border border-bone/30 bg-carbon",
            )}
            style={{ left: `${bezierAt([0.16, 1, 0.3, 1], t) * 100}%`, opacity: last ? 1 : 0.3 + t * 0.6 }}
          />
        );
      })}
    </div>
  );
}

export function PageHero({
  kicker,
  title,
  lede,
  children,
  align = "left",
  className,
}: {
  kicker: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <section className={cn("relative border-b border-hairline", className)}>
      <div
        className={cn(
          "container-page pb-14 pt-14 sm:pb-20 sm:pt-20",
          align === "center" && "text-center",
        )}
      >
        <p className="fade-rise eyebrow">{kicker}</p>
        <h1
          className={cn(
            "fade-rise mt-5 max-w-[18ch] text-[clamp(2.6rem,6.2vw,5.4rem)] font-medium leading-[0.95] tracking-[-0.05em] text-balance",
            align === "center" && "mx-auto",
          )}
          style={{ ["--d" as string]: "0.06s" }}
        >
          {title}
        </h1>
        {lede ? (
          <p
            className={cn(
              "fade-rise mt-6 max-w-2xl text-[17px] leading-relaxed text-ink-2 text-pretty",
              align === "center" && "mx-auto",
            )}
            style={{ ["--d" as string]: "0.12s" }}
          >
            {lede}
          </p>
        ) : null}
        {children}
        <ExposureRule
          className={cn("fade-rise mt-12 max-w-md", align === "center" && "mx-auto")}
        />
      </div>
    </section>
  );
}
