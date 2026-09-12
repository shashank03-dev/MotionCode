import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter, SiteHeader } from "./site-chrome";

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

export function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SiteHeader />
      <main>
        <section className="border-b border-hairline">
          <div className="container-page py-16">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 font-mono text-xs text-ink-2 shadow-ring transition-colors hover:bg-white/[0.04] hover:text-ink"
            >
              <span aria-hidden="true">←</span>
              Back to MotionCode
            </Link>
            <p className="eyebrow mt-10">Last updated {updated}</p>
            <h1 className="mt-4 max-w-3xl font-display text-3xl font-medium leading-tight tracking-tight text-balance sm:text-5xl">
              {title}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-ink-2 sm:text-lg">
              {intro}
            </p>
          </div>
        </section>

        <section className="border-b border-hairline bg-panel/40">
          <div className="container-page py-14">
            <div className="grid gap-4">
              {sections.map((section, index) => (
                <article
                  key={section.title}
                  className="glass-card rounded-2xl p-5 sm:p-6"
                >
                  <p className="font-mono text-[11px] tracking-[0.2em] text-ink-3">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-3 font-display text-2xl tracking-tight text-ink">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-base leading-7 text-ink-2">
                    {section.body.map((paragraph, pi) => (
                      <p key={`${section.title}-${pi}`}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
