import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export function LegalPage({ title, updated, intro, sections }: LegalPageProps) {
  return (
    <main className="bg-[#10120d] text-[#fffbf4]">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#9ef0c0] hover:text-[#c8ffd9]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to MotionCode
          </Link>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.22em] text-[#ffd166]">
            Last updated {updated}
          </p>
          <h1 className="mt-4 font-mono text-4xl leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 text-lg leading-8 text-[#d8cfbc]/75">{intro}</p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {sections.map((section) => (
              <article key={section.title}>
                <h2 className="font-mono text-2xl text-[#fffbf4]">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-base leading-7 text-[#d8cfbc]/75">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
