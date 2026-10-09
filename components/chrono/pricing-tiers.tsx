import type { ReactNode } from "react";

import { bezierAt } from "@/lib/chrono/bezier";
import { MAX_FRAMES, type PricingTier } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * A tier's sampling resolution drawn as its own chronophotograph: the same
 * expo-out move exposed `frames` times. More frames, a finer read of the
 * curve — the difference between plans, shown in the house language.
 * Hover the card and the plate re-exposes, one strobe at a time.
 */
export function ExposureStrip({
  frames,
  lit,
  className,
}: {
  frames: number;
  lit?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <div className="relative h-9" aria-hidden>
        <span className="absolute inset-x-0 top-1/2 h-px bg-hairline" />
        {Array.from({ length: frames }, (_, i) => {
          const t = i / (frames - 1);
          const head = i === frames - 1;
          return (
            <span
              key={i}
              className={cn(
                "tier-sample absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-[3px]",
                head && lit ? "bg-accent" : head ? "bg-bone" : "border border-bone/40 bg-carbon",
              )}
              style={{
                left: `${bezierAt([0.16, 1, 0.3, 1], t) * 100}%`,
                opacity: head ? 1 : 0.3 + t * 0.6,
                animationDelay: `${i * 45}ms`,
              }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
        <span>
          <span className="text-ink tabular-nums">{frames}</span> frames / analysis
        </span>
        <span className="tabular-nums">
          {Math.round((frames / MAX_FRAMES) * 100)}% res
        </span>
      </div>
    </div>
  );
}

export function TierCard({
  tier,
  index,
  cta,
  className,
}: {
  tier: PricingTier;
  index: number;
  /** The call to action — a link on the landing page, Razorpay on /pricing. */
  cta: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col border-b border-hairline py-10 lg:border-b-0 lg:px-8 lg:py-12",
        index > 0 && "lg:border-l",
        index === 0 && "lg:pl-0",
        tier.featured && "lg:bg-bone/[0.025]",
        className,
      )}
    >
      {tier.featured ? (
        <span className="absolute inset-x-0 top-0 h-px bg-accent lg:-top-px" aria-hidden />
      ) : null}

      <div className="flex items-center justify-between">
        <h3 className="text-[1.6rem] tracking-[-0.04em]">{tier.name}</h3>
        {tier.featured ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">Most popular</span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
            Plate {String(index + 1).padStart(2, "0")}
          </span>
        )}
      </div>
      <p className="mt-2 min-h-[3rem] text-[15px] leading-6 text-ink-2">{tier.blurb}</p>

      <p className="mt-8 flex items-baseline gap-2">
        <span className="text-[clamp(3.5rem,6vw,5rem)] font-medium leading-none tracking-[-0.06em]">
          {tier.price}
        </span>
        <span className="font-mono text-[12px] text-ink-3">{tier.cadence}</span>
      </p>

      <ExposureStrip frames={tier.frames} lit={tier.featured} className="mt-9" />

      <div className="mt-9 flex-1">
        {tier.inherits ? (
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">{tier.inherits}</p>
        ) : null}
        <ul className="border-t border-hairline">
          {tier.highlights.map((line) => (
            <li
              key={line}
              className="flex items-center gap-3 border-b border-hairline py-3 text-[14.5px] text-ink-2"
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-[2px]",
                  tier.featured ? "bg-accent" : "bg-ink-3",
                )}
                aria-hidden
              />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">{cta}</div>
    </article>
  );
}
