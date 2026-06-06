import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LifecycleRail } from "@/components/lifecycle";
import {
  ExampleGallery,
  MotionSpecPreview,
  SiteFooter,
  SiteHeader,
} from "@/components/marketing";

export const metadata: Metadata = {
  title: "Examples - MotionCode",
  description:
    "Review sample MotionCode specs and starter snippets for common UI motion patterns.",
};

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-[#10120d] text-[#fffbf4]">
      <SiteHeader />

      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#9ef0c0]">
                Examples
              </p>
              <h1 className="mt-4 font-mono text-4xl leading-tight sm:text-6xl">
                Sample motion specs and starter code.
              </h1>
              <p className="mt-6 text-lg leading-8 text-[#d8cfbc]/75">
                These examples show the kind of compact motion notes and snippets
                MotionCode is designed to produce. Treat them as drafts, not
                finished implementation.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/app"
                  className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#9ef0c0] px-5 text-sm font-semibold text-[#10120d] hover:bg-[#c8ffd9]"
                >
                  Try the app
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/#pricing"
                  className="inline-flex h-11 items-center rounded-[8px] border border-white/15 px-5 text-sm font-semibold text-[#fffbf4] hover:border-[#9ef0c0]/50"
                >
                  Pricing
                </Link>
              </div>
            </div>

            <MotionSpecPreview />
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0d100b]">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <ExampleGallery />
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ffd166]">
                Review loop
              </p>
              <h2 className="mt-3 font-mono text-3xl leading-tight sm:text-4xl">
                Keep each snippet tied to the reference.
              </h2>
            </div>
            <LifecycleRail />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
