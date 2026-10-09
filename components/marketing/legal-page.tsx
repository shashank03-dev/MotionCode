import Link from "next/link";
import type { ReactNode } from "react";

import { PageHero } from "@/components/chrono/page-hero";

import { SiteFooter } from "./site-chrome";
import { SiteHeader } from "./site-header";

type LegalSection = {
  title: string;
  body: ReactNode[];
};

type LegalPageProps = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const slug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Legal and policy pages: an editorial document with a sticky index. */
export function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SiteHeader />
      <main>
        <PageHero kicker={`Last updated ${updated}`} title={title} lede={intro}>
          <Link
            href="/"
            className="fade-rise mt-8 inline-flex min-h-[44px] items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 transition-colors hover:text-ink"
          >
            <span aria-hidden="true">←</span>
            Back to MotionCode
          </Link>
        </PageHero>

        <div className="container-page grid gap-12 py-16 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:py-24">
          <nav aria-label="On this page" className="hidden lg:block">
            <ol className="sticky top-28 space-y-1 border-l border-hairline">
              {sections.map((section, index) => (
                <li key={section.title}>
                  <a
                    href={`#${slug(section.title)}`}
                    className="-ml-px flex gap-3 border-l border-transparent py-1.5 pl-4 text-[13px] text-ink-3 transition-colors hover:border-accent hover:text-ink"
                  >
                    <span className="font-mono tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="max-w-3xl">
            {sections.map((section, index) => (
              <article
                key={section.title}
                id={slug(section.title)}
                className="scroll-mt-24 border-t border-hairline py-10 first:border-t-0 first:pt-0"
              >
                <p className="font-mono text-[11px] tracking-[0.16em] text-accent">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.2rem)] tracking-[-0.04em] text-ink">
                  {section.title}
                </h2>
                <div className="mt-5 space-y-4 text-[16px] leading-[1.75] text-ink-2">
                  {section.body.map((paragraph, pi) => (
                    <p key={`${section.title}-${pi}`}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
