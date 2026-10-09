import Link from "next/link";
import { Check, Minus, Plus } from "lucide-react";

import { PageHero } from "@/components/chrono/page-hero";
import { TierCard } from "@/components/chrono/pricing-tiers";
import { SiteFooter, SiteHeader } from "@/components/marketing";
import { ButtonLink } from "@/components/ui/site-button";
import type { PlanTier } from "@/lib/contracts/plans";
import {
  COMPARISON,
  PRICING_FAQ,
  PRICING_TIERS,
  type ComparisonValue,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

import { CheckoutButton } from "./CheckoutButton";

export const dynamic = "force-dynamic";

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <SiteHeader />
      <main>
        <PageHero
          kicker="Pricing"
          title={
            <>
              Access tiers for <span className="serif-em">motion analysis.</span>
            </>
          }
          lede="Start free, then upgrade through Razorpay when production work needs more analyses, finer sampling, saved projects, or shared workspace access."
        />

        <section className="container-page py-16 sm:py-24" aria-label="Plans">
          <div className="grid border-t border-hairline-strong lg:grid-cols-3">
            {PRICING_TIERS.map((tier, index) => (
              <TierCard
                key={tier.tier}
                tier={tier}
                index={index}
                cta={
                  tier.tier === "free" ? (
                    <ButtonLink href="/app" variant="outline" size="lg" className="w-full">
                      {tier.cta.label} →
                    </ButtonLink>
                  ) : (
                    <CheckoutButton
                      planTier={tier.tier}
                      variant={tier.featured ? "primary" : "outline"}
                    />
                  )
                }
              />
            ))}
          </div>

          <p className="mt-10 border-t border-hairline pt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            Prices in USD, billed monthly through Razorpay. Cancel anytime from
            your account.
          </p>
        </section>

        <Comparison />
        <Faq />

        <section className="border-t border-hairline">
          <div className="container-page flex flex-col items-start justify-between gap-8 py-20 sm:py-24 lg:flex-row lg:items-end">
            <h2 className="max-w-[16ch] text-[clamp(2.2rem,5vw,4rem)] font-medium leading-[0.95] tracking-[-0.05em]">
              Bring one clip. <span className="serif-em">Leave with the code.</span>
            </h2>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/app" variant="primary" size="lg">
                Start free
              </ButtonLink>
              <ButtonLink href="/contact" variant="outline" size="lg">
                Talk to us
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

const TIERS: PlanTier[] = PRICING_TIERS.map((t) => t.tier);

function Cell({ value, featured }: { value: ComparisonValue; featured: boolean }) {
  if (value === true) {
    return (
      <>
        <Check className={cn("size-4", featured ? "text-accent" : "text-ink")} aria-hidden />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus className="size-4 text-ink-3/60" aria-hidden />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="font-mono text-[12.5px] tabular-nums text-ink">{value}</span>;
}

/** Every enforced limit side by side, straight from PLAN_ENTITLEMENTS. */
function Comparison() {
  return (
    <section id="compare" className="scroll-mt-20 border-t border-hairline py-20 sm:py-28">
      <div className="container-page">
        <p className="eyebrow">Compare</p>
        <h2 className="mt-4 text-[clamp(2.2rem,4.6vw,3.6rem)] font-medium leading-[0.95] tracking-[-0.05em]">
          Every limit, <span className="serif-em">side by side.</span>
        </h2>

        <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 md:hidden" aria-hidden>
          Swipe to compare →
        </p>
        <div className="relative mt-3 overflow-x-auto md:mt-12" data-lenis-prevent>
          <table className="w-full min-w-[600px] border-collapse text-left">
            <caption className="sr-only">Plan comparison</caption>
            <thead>
              <tr className="border-b border-hairline-strong">
                <th scope="col" className="sticky left-0 z-10 w-[40%] bg-carbon py-4 pr-4 font-mono text-[10px] font-normal uppercase tracking-[0.16em] text-ink-3">
                  Feature
                </th>
                {PRICING_TIERS.map((tier) => (
                  <th
                    key={tier.tier}
                    scope="col"
                    className={cn(
                      "relative px-4 py-4 align-bottom",
                      tier.featured && "bg-bone/[0.025]",
                    )}
                  >
                    {tier.featured ? (
                      <span className="absolute inset-x-0 top-0 h-px bg-accent" aria-hidden />
                    ) : null}
                    <span className="block text-[17px] font-medium tracking-[-0.03em]">{tier.name}</span>
                    <span className="mt-0.5 block font-mono text-[11px] font-normal text-ink-3">
                      {tier.price}
                      {tier.cadence}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            {COMPARISON.map((group) => (
              <tbody key={group.title}>
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={TIERS.length + 1}
                    className="pb-2 pt-10 font-mono text-[11px] font-normal uppercase tracking-[0.16em] text-accent"
                  >
                    {group.title}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label} className="border-b border-hairline transition-colors hover:bg-bone/[0.02]">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 max-w-[44vw] bg-carbon py-3.5 pr-4 text-[14.5px] font-normal text-ink-2 md:max-w-none"
                    >
                      {row.label}
                      {row.hint ? (
                        <span className="mt-0.5 block text-[12.5px] text-ink-3">{row.hint}</span>
                      ) : null}
                    </th>
                    {PRICING_TIERS.map((tier) => (
                      <td key={tier.tier} className={cn("px-4 py-3.5", tier.featured && "bg-bone/[0.025]")}>
                        <Cell value={row.values[tier.tier]} featured={tier.featured} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="border-t border-hairline py-20 sm:py-28" aria-labelledby="faq-title">
      <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
        <div>
          <p className="eyebrow">Questions</p>
          <h2 id="faq-title" className="mt-4 text-[clamp(2.2rem,4.6vw,3.6rem)] font-medium leading-[0.95] tracking-[-0.05em]">
            Before you <span className="serif-em">upgrade.</span>
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-2">
            Anything else, write to us from the{" "}
            <Link href="/contact" className="text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-accent">
              contact page
            </Link>
            .
          </p>
        </div>
        <div className="border-t border-hairline-strong">
          {PRICING_FAQ.map((item, i) => (
            <details key={item.q} className="group border-b border-hairline" open={i === 0}>
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] tracking-[-0.02em] text-ink [&::-webkit-details-marker]:hidden">
                <span className="flex items-baseline gap-4">
                  <span className="font-mono text-[11px] tabular-nums text-ink-3 transition-colors group-open:text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item.q}
                </span>
                <Plus
                  className="size-4 shrink-0 text-ink-3 transition-transform duration-500 ease-expo group-open:rotate-45 group-open:text-ink"
                  aria-hidden
                />
              </summary>
              <div className="pb-6 pl-9 pr-10 text-[15px] leading-relaxed text-ink-2">
                {item.a}
                {item.link ? (
                  <>
                    {" "}
                    <Link
                      href={item.link.href}
                      className="text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-accent"
                    >
                      {item.link.label}
                    </Link>
                  </>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
