import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileCode2,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import { LifecycleRail } from "@/components/lifecycle";
import {
  ExampleGallery,
  MotionSpecPreview,
  SiteFooter,
  SiteHeader,
} from "@/components/marketing";
import { OnboardingSteps } from "@/components/onboarding";

export const metadata: Metadata = {
  title: "MotionCode - Motion References to Starter Code",
  description:
    "Turn short animation references into reviewable motion specs and starter snippets for CSS, GSAP, and Framer Motion.",
};

const fitChecks = [
  "Best for short UI motion references with clear start and end states.",
  "Outputs are drafts you inspect before shipping.",
  "The app route is available now; paid billing is not enabled in this surface.",
];

const truthfulCapabilities = [
  {
    title: "Motion spec first",
    description:
      "Capture intent, element, duration, easing, and frame count before looking at code.",
    icon: FileCode2,
  },
  {
    title: "Human review built in",
    description:
      "The UI keeps generated snippets visible so selectors, states, and timing can be edited.",
    icon: CheckCircle2,
  },
  {
    title: "Clear product status",
    description:
      "Pricing, support, privacy, and terms are linked directly from the product surface.",
    icon: ShieldCheck,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#10120d] text-[#fffbf4]">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div
            className="absolute inset-0 opacity-50"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(circle at 18% 20%, rgba(158,240,192,.18), transparent 26%), radial-gradient(circle at 82% 12%, rgba(245,143,124,.16), transparent 25%), linear-gradient(135deg, rgba(255,209,102,.08), transparent 42%)",
            }}
          />
          <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#9ef0c0]">
                Motion reference to readable code
              </p>
              <h1 className="mt-5 max-w-4xl font-mono text-5xl leading-[1.02] text-[#fffbf4] sm:text-6xl lg:text-7xl">
                MotionCode turns short animation clips into inspectable starter
                code.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#d8cfbc]/80">
                Upload a focused motion reference, review the generated motion
                spec, then copy a CSS, GSAP, or Framer Motion draft that your
                team can tune in context.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/app"
                  className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#9ef0c0] px-5 text-sm font-semibold text-[#10120d] hover:bg-[#c8ffd9]"
                >
                  Open app
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/examples"
                  className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-white/15 px-5 text-sm font-semibold text-[#fffbf4] hover:border-[#9ef0c0]/50"
                >
                  View examples
                </Link>
              </div>

              <ul className="mt-9 space-y-3">
                {fitChecks.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-sm leading-6 text-[#d8cfbc]/75"
                  >
                    <CheckCircle2
                      className="mt-0.5 size-5 shrink-0 text-[#9ef0c0]"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <MotionSpecPreview />
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0d100b]">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ffd166]">
                  What it does
                </p>
                <h2 className="mt-3 font-mono text-3xl leading-tight sm:text-4xl">
                  A narrow tool for translating motion references.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#d8cfbc]/70">
                MotionCode is deliberately scoped: it helps describe UI motion
                and produces starter snippets. It does not replace design
                review, accessibility review, or code review.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {truthfulCapabilities.map((capability) => {
                const Icon = capability.icon;

                return (
                  <article
                    key={capability.title}
                    className="rounded-[8px] border border-white/10 bg-[#151811] p-6"
                  >
                    <div className="mb-6 flex size-11 items-center justify-center rounded-[8px] bg-[#9ef0c0]/10 text-[#9ef0c0]">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <h3 className="font-mono text-xl">{capability.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[#d8cfbc]/75">
                      {capability.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f58f7c]">
                Onboarding
              </p>
              <h2 className="mt-3 font-mono text-3xl leading-tight sm:text-4xl">
                Four steps from reference to draft.
              </h2>
            </div>
            <OnboardingSteps />
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0d100b]">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-3xl">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#9ef0c0]">
                Lifecycle
              </p>
              <h2 className="mt-3 font-mono text-3xl leading-tight sm:text-4xl">
                Keep the generated code accountable to the original motion.
              </h2>
            </div>
            <LifecycleRail />
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ffd166]">
                  Examples
                </p>
                <h2 className="mt-3 font-mono text-3xl leading-tight sm:text-4xl">
                  Sample specs and code shapes.
                </h2>
              </div>
              <Link
                href="/examples"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#9ef0c0] hover:text-[#c8ffd9]"
              >
                Open examples route
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <ExampleGallery compact />
          </div>
        </section>

        <section id="pricing" className="border-b border-white/10 bg-[#0d100b]">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#f58f7c]">
                Pricing
              </p>
              <h2 className="mt-3 font-mono text-3xl leading-tight sm:text-4xl">
                Preview access is the only plan shown here.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#d8cfbc]/75">
                Billing is not exposed on this product surface. When paid plans
                are enabled, limits and terms should appear here before checkout.
              </p>
            </div>

            <article className="rounded-[8px] border border-[#9ef0c0]/30 bg-[#151811] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-mono text-2xl">Preview</h3>
                  <p className="mt-2 text-sm text-[#d8cfbc]/70">
                    Explore the current app route and example output patterns.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-[8px] bg-[#9ef0c0]/10 px-3 py-2 font-mono text-sm text-[#9ef0c0]">
                  <Gauge className="size-4" aria-hidden="true" />
                  $0 shown
                </div>
              </div>
              <ul className="mt-6 grid gap-3 text-sm leading-6 text-[#d8cfbc]/75 sm:grid-cols-2">
                <li>Access the current converter UI.</li>
                <li>Review sample specs on the examples route.</li>
                <li>Read support, privacy, and terms before using it.</li>
                <li>Bring your own review before shipping output.</li>
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/app"
                  className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#9ef0c0] px-4 text-sm font-semibold text-[#10120d] hover:bg-[#c8ffd9]"
                >
                  Open app
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/support"
                  className="inline-flex h-10 items-center rounded-[8px] border border-white/15 px-4 text-sm font-semibold text-[#fffbf4] hover:border-[#9ef0c0]/50"
                >
                  Support
                </Link>
                <Link
                  href="/privacy"
                  className="inline-flex h-10 items-center rounded-[8px] border border-white/15 px-4 text-sm font-semibold text-[#fffbf4] hover:border-[#9ef0c0]/50"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="inline-flex h-10 items-center rounded-[8px] border border-white/15 px-4 text-sm font-semibold text-[#fffbf4] hover:border-[#9ef0c0]/50"
                >
                  Terms
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
