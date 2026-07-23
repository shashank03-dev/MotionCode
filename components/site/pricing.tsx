"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PRICING } from "@/lib/content";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { ButtonLink } from "@/components/ui/site-button";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="container-page py-24 sm:py-28">
      <div className="mb-14 text-center">
        <div className="eyebrow mb-4">Pricing</div>
        <h2 className="text-4xl tracking-tight sm:text-5xl">
          Start free. Scale when it ships.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[17px] text-ink-2">
          No credit card to try. Every plan exports accessible, reduced-motion-safe
          code.
        </p>
      </div>

      <motion.div
        variants={staggerContainer(0.09)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="grid gap-4 lg:grid-cols-3"
      >
        {PRICING.map((tier) => (
          <motion.div
            key={tier.name}
            variants={fadeUp}
            className={cn(
              "glass-card relative flex flex-col rounded-2xl p-7",
              tier.featured
                ? "!border-[var(--accent-border)] shadow-glow"
                : "",
            )}
          >
            {tier.featured && (
              <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-black">
                Most popular
              </span>
            )}
            <h3 className="text-lg font-medium tracking-tight">{tier.name}</h3>
            <div className="mt-4 flex items-end gap-1">
              <span className="font-display text-5xl tracking-tight">{tier.price}</span>
              <span className="mb-1.5 font-mono text-[12px] text-ink-3">
                {tier.cadence}
              </span>
            </div>
            <p className="mt-3 text-[14px] text-ink-2">{tier.blurb}</p>

            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-[14px]">
                  <Check
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      tier.featured ? "text-accent" : "text-ink-3",
                    )}
                    strokeWidth={2}
                  />
                  <span className="text-ink-2">{feat}</span>
                </li>
              ))}
            </ul>

            <ButtonLink
              href={tier.href}
              variant={tier.featured ? "primary" : "outline"}
              size="md"
              className="mt-7 w-full"
            >
              {tier.cta}
            </ButtonLink>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
