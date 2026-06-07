import Link from "next/link";

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
    <main className="bg-[#080808] text-[#fffbf4]">
      <section className="border-b border-[#1a1a1a]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-[#1a1a1a] px-3 py-2 font-mono text-xs text-[#00ff88] transition-colors hover:border-[#00ff88]/60 hover:bg-[#00ff88]/10"
          >
            <span aria-hidden="true">←</span>
            Back to MotionCode
          </Link>
          <p className="mt-10 font-mono text-xs uppercase tracking-[0.22em] text-[#00ff88]">
            Last updated {updated}
          </p>
          <h1 className="mt-4 max-w-3xl font-mono text-4xl font-bold leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[#565449] sm:text-lg">
            {intro}
          </p>
        </div>
      </section>

      <section className="border-b border-[#1a1a1a] bg-[#11120d]">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-4">
            {sections.map((section, index) => (
              <article
                key={section.title}
                className="border border-[#1a1a1a] bg-[#080808] p-5 sm:p-6"
              >
                <p className="font-mono text-[11px] text-[#00ff88]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 font-mono text-2xl text-[#fffbf4]">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-base leading-7 text-[#d8cfbc]/70">
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
