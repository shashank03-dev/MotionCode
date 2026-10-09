import { ArrowUpRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/site-button";
import { PRICING_TIERS } from "@/lib/pricing";

import { TierCard } from "./pricing-tiers";
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
          <p className="max-w-sm text-[15px] leading-relaxed text-ink-2 lg:text-right">
            Every plan reads the same motion and writes the same three targets.
            Paid plans sample finer, edit and export, and keep the history.
          </p>
        </Reveal>

        <div className="mt-14 grid border-t border-hairline-strong lg:grid-cols-3">
          {PRICING_TIERS.map((tier, i) => (
            <Reveal key={tier.tier} delay={i * 0.08} className="flex">
              <TierCard
                tier={tier}
                index={i}
                className="w-full"
                cta={
                  <ButtonLink
                    href={tier.cta.href}
                    variant={tier.featured ? "primary" : "outline"}
                    size="lg"
                    className="w-full"
                  >
                    {tier.cta.label}
                  </ButtonLink>
                }
              />
            </Reveal>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            USD · billed monthly via Razorpay · cancel anytime
          </p>
          <a
            href="/pricing#compare"
            className="inline-flex min-h-[44px] items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 transition-colors hover:text-ink"
          >
            Compare every limit
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
