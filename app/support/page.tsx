import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bug,
  ClipboardList,
  HelpCircle,
  LifeBuoy,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Support - MotionCode",
  description:
    "Find practical support guidance for MotionCode, including what to include when reporting an issue.",
};

const supportCards = [
  {
    title: "Before reporting",
    description:
      "Try a short, focused clip and note the browser, clip length, and exact error text.",
    icon: ClipboardList,
  },
  {
    title: "App issues",
    description:
      "If analysis fails, capture whether the problem happened while sampling frames or generating output.",
    icon: Bug,
  },
  {
    title: "Product questions",
    description:
      "Use the examples, privacy, and terms pages to understand the current product surface.",
    icon: HelpCircle,
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#10120d] text-[#fffbf4]">
      <SiteHeader />

      <main>
        <section className="border-b border-white/10">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex size-12 items-center justify-center rounded-[8px] bg-[#9ef0c0]/10 text-[#9ef0c0]">
              <LifeBuoy className="size-6" aria-hidden="true" />
            </div>
            <p className="mt-8 font-mono text-xs uppercase tracking-[0.22em] text-[#ffd166]">
              Support
            </p>
            <h1 className="mt-4 max-w-3xl font-mono text-4xl leading-tight sm:text-6xl">
              Get useful details ready before asking for help.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#d8cfbc]/75">
              This route is an informational support surface. It does not post
              to a support endpoint in this build, so issue details should be
              shared through your project&apos;s normal support channel.
            </p>
          </div>
        </section>

        <section className="border-b border-white/10 bg-[#0d100b]">
          <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
            {supportCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className="rounded-[8px] border border-white/10 bg-[#151811] p-6"
                >
                  <div className="mb-6 flex size-11 items-center justify-center rounded-[8px] bg-[#f58f7c]/10 text-[#f58f7c]">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h2 className="font-mono text-xl">{card.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#d8cfbc]/75">
                    {card.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8">
            <article className="rounded-[8px] border border-[#9ef0c0]/30 bg-[#151811] p-6">
              <h2 className="font-mono text-2xl">Quick checklist</h2>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-[#d8cfbc]/75">
                <li>Route where the issue happened.</li>
                <li>Browser and operating system.</li>
                <li>Clip length and file type.</li>
                <li>Error message or unexpected output.</li>
                <li>Whether retrying with a shorter clip changed the result.</li>
              </ul>
            </article>

            <article className="rounded-[8px] border border-white/10 bg-[#151811] p-6">
              <h2 className="font-mono text-2xl">Helpful routes</h2>
              <div className="mt-5 grid gap-3">
                {[
                  { href: "/app", label: "Open the app" },
                  { href: "/examples", label: "Review examples" },
                  { href: "/privacy", label: "Read privacy notes" },
                  { href: "/terms", label: "Read terms" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex items-center justify-between rounded-[8px] border border-white/10 px-4 py-3 text-sm text-[#fffbf4] hover:border-[#9ef0c0]/50"
                  >
                    {link.label}
                    <ArrowRight
                      className="size-4 text-[#9ef0c0]"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
