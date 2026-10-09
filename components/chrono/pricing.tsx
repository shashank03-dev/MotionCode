import { ArrowUpRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/site-button";
import { PRICING } from "@/lib/content";
import { cn } from "@/lib/utils";

import { Reveal } from "./reveal";

/** Plate 05 — three exposures of the same product, priced. */
export function Pricing() {
  return (
    <section id="pricing" className="relative border-t border-hairline py-28 sm:py-36">
      <div className="container-page">
        <Reveal className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow">Pricing</p>
            <h2 className="display-lg mt-4 max-w-[16ch]">
              Start free. <span className="serif-em">Scale when it ships.</span>
            </h2>
          </div>
          <a
            href="/pricing"
            className="inline-flex min-h-[44px] items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 transition-colors hover:text-ink"
          >
            Compare every limit
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </Reveal>

        <div className="mt-14 grid border-t border-hairline-strong lg:grid-cols-3">
          {PRICING.map((tier, i) => (
            <Reveal
              key={tier.name}
              delay={i * 0.08}
              className={cn(
                "relative flex flex-col border-b border-hairline py-10 lg:border-b-0 lg:px-8 lg:py-12",
                i > 0 && "lg:border-l",
                i === 0 && "lg:pl-0",
                tier.featured && "lg:bg-bone/[0.025]",
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
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </div>
              <p className="mt-2 text-[15px] text-ink-2">{tier.blurb}</p>

              <p className="mt-10 flex items-baseline gap-2">
                <span className="text-[clamp(3.5rem,6vw,5rem)] font-medium leading-none tracking-[-0.06em]">
                  {tier.price}
                </span>
                <span className="font-mono text-[12px] text-ink-3">{tier.cadence}</span>
              </p>

              <ul className="mt-10 flex-1 border-t border-hairline">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 border-b border-hairline py-3 text-[14.5px] text-ink-2"
                  >
                    <span
                      className={cn("size-1.5 shrink-0 rounded-full", tier.featured ? "bg-accent" : "bg-ink-3")}
                      aria-hidden
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <ButtonLink
                href={tier.href}
                variant={tier.featured ? "primary" : "outline"}
                size="lg"
                className="mt-10 w-full"
              >
                {tier.cta}
              </ButtonLink>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
