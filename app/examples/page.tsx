import type { Metadata } from "next";
import Link from "next/link";
import {
  cssStarter,
  examples,
  motionSpec,
  SiteFooter,
  SiteHeader,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "Examples - MotionCode",
  description:
    "Review sample MotionCode specs and starter snippets for common UI motion patterns.",
};

const reviewLoopItems = [
  {
    title: "Reference",
    detail: "A short clip that shows the motion clearly.",
  },
  {
    title: "Spec",
    detail: "Intent, element, duration, easing, and frame count.",
  },
  {
    title: "Snippet",
    detail: "CSS, GSAP, or Framer Motion starter code to inspect.",
  },
  {
    title: "Review",
    detail: "Human edits for selectors, states, and reduced motion.",
  },
];

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#fffbf4]">
      <SiteHeader />

      <main>
        <section className="border-b border-[#1a1a1a]">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00ff88]">
                {"// examples"}
              </p>
              <h1 className="mt-4 max-w-3xl font-mono text-4xl font-bold leading-tight sm:text-6xl">
                Sample motion specs and starter code.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-[#565449] sm:text-lg">
                These examples show the kind of compact motion notes and snippets
                MotionCode is designed to produce. Treat them as drafts, not
                finished implementation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/app"
                  className="inline-flex h-11 items-center border border-[#00ff88] bg-[#00ff88] px-5 font-mono text-xs font-bold text-[#080808] transition-opacity hover:opacity-90"
                >
                  Try the app →
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex h-11 items-center border border-[#1a1a1a] px-5 font-mono text-xs font-bold text-[#fffbf4] transition-colors hover:border-[#00ff88]/60 hover:bg-[#00ff88]/10"
                >
                  Pricing
                </Link>
              </div>
            </div>

            <SpecPreview />
          </div>
        </section>

        <section className="border-b border-[#1a1a1a] bg-[#11120d]">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <ExampleGrid />
          </div>
        </section>

        <section className="border-b border-[#1a1a1a]">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00ff88]">
                {"// review loop"}
              </p>
              <h2 className="mt-3 font-mono text-3xl font-bold leading-tight sm:text-4xl">
                Keep each snippet tied to the reference.
              </h2>
            </div>
            <ReviewLoop />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SpecPreview() {
  return (
    <div className="min-w-0 border border-[#1a1a1a] bg-[#11120d]">
      <div className="flex items-center justify-between border-b border-[#1a1a1a] px-4 py-3">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#00ff88]">
          {"{ motion spec }"}
        </div>
        <span className="border border-[#1a1a1a] px-2 py-1 font-mono text-[11px] text-[#565449]">
          sample
        </span>
      </div>

      <div className="grid min-w-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-w-0 border-b border-[#1a1a1a] p-4 lg:border-b-0 lg:border-r">
          <pre className="max-w-full overflow-x-auto font-mono text-sm leading-6 text-[#fffbf4]">
            <code>{motionSpec}</code>
          </pre>
        </div>
        <div className="min-w-0 bg-[#080808] p-4">
          <div className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[#00ff88]">
            CSS starter
          </div>
          <pre className="max-w-full overflow-x-auto font-mono text-sm leading-6 text-[#d8cfbc]">
            <code>{cssStarter}</code>
          </pre>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-[#1a1a1a] bg-[#080808] px-4 py-3 text-sm text-[#565449]">
        <span className="size-2 bg-[#00ff88]" aria-hidden="true" />
        Review the spec, adjust the code, then paste it into your project.
      </div>
    </div>
  );
}

function ExampleGrid() {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-3">
      {examples.map((example, index) => {
        const Icon = example.icon;

        return (
          <article
            key={example.title}
            className="min-w-0 border border-[#1a1a1a] bg-[#080808] p-5 transition-colors hover:border-[#00ff88]/60"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex size-10 items-center justify-center border border-[#1a1a1a] text-[#00ff88]">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#565449]">
                {String(index + 1).padStart(2, "0")} / {example.intent}
              </span>
            </div>
            <h3 className="font-mono text-xl text-[#fffbf4]">
              {example.title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-[#d8cfbc]/70">
              {example.description}
            </p>
            <p className="mt-4 border-t border-[#1a1a1a] pt-4 font-mono text-xs leading-5 text-[#00ff88]">
              {example.spec}
            </p>
            <pre className="mt-4 max-w-full overflow-x-auto border border-[#1a1a1a] bg-[#11120d] p-4 font-mono text-xs leading-5 text-[#d8cfbc]">
              <code>{example.code}</code>
            </pre>
          </article>
        );
      })}
    </div>
  );
}

function ReviewLoop() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {reviewLoopItems.map((item, index) => (
        <article
          key={item.title}
          className="relative border border-[#1a1a1a] bg-[#11120d] p-5"
        >
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-8 items-center justify-center border border-[#00ff88]/40 font-mono text-xs text-[#00ff88]">
              {index + 1}
            </span>
            <span className="h-px flex-1 bg-[#1a1a1a]" aria-hidden="true" />
          </div>
          <h3 className="font-mono text-lg text-[#fffbf4]">{item.title}</h3>
          <p className="mt-3 text-sm leading-6 text-[#d8cfbc]/70">
            {item.detail}
          </p>
        </article>
      ))}
    </div>
  );
}
