import Link from "next/link";
import { ArrowRight, Code2 } from "lucide-react";

const primaryLinks = [
  { href: "/examples", label: "Examples" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/support", label: "Support" },
];

const footerLinks = [
  { href: "/examples", label: "Examples" },
  { href: "/app", label: "App" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#10120d]/90 backdrop-blur-xl">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.18em] text-[#fffbf4]"
        >
          <Code2 className="size-5 text-[#9ef0c0]" aria-hidden="true" />
          MotionCode
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[#d8cfbc]/75 hover:text-[#fffbf4]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/app"
          className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#9ef0c0]/40 bg-[#9ef0c0] px-4 text-sm font-semibold text-[#10120d] shadow-[0_0_24px_rgba(158,240,192,0.18)] hover:bg-[#c8ffd9]"
        >
          Open app
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#0b0d09]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-[0.18em] text-[#fffbf4]"
          >
            <Code2 className="size-5 text-[#9ef0c0]" aria-hidden="true" />
            MotionCode
          </Link>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#d8cfbc]/70">
            A focused motion analysis tool for converting short animation
            references into reviewable specs and starter snippets.
          </p>
        </div>

        <div className="flex flex-wrap items-start gap-x-6 gap-y-3 md:justify-end">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-[#d8cfbc]/70 hover:text-[#fffbf4]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
