import Link from "next/link";

import { MarketingAuthNavActions } from "./auth-nav-actions";

const primaryLinks = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/support", label: "Support" },
];

const footerGroups = [
  {
    title: "Product",
    links: [
      { href: "/app", label: "Converter" },
      { href: "/#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/support", label: "Support" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/account", label: "Account" },
      { href: "/billing", label: "Billing" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#080808]/95 backdrop-blur-md">
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-10"
      >
        <Link
          href="/"
          className="font-mono text-base text-[#00ff88] transition-colors hover:text-[#fffbf4]"
        >
          ⟨/⟩ MotionCode
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-xs text-[#565449] transition-colors hover:text-[#fffbf4]"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <MarketingAuthNavActions variant="site" />
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-[#1a1a1a] bg-[#080808]">
      <div className="mx-auto w-full px-4 pt-16 sm:px-6 lg:px-10">
        <div className="grid gap-12 border-b border-[#1a1a1a] pb-14 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Link
              href="/"
              className="font-mono text-lg text-[#00ff88] transition-colors hover:text-[#fffbf4]"
            >
              ⟨/⟩ MotionCode
            </Link>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#3a3a4a]">
              Intelligence for motion.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {["4 frameworks", "< 30s analysis", "open beta"].map((badge) => (
                <span
                  key={badge}
                  className="border border-[#1a1a1a] px-3 py-1.5 font-mono text-[11px] text-[#565449]"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-9 sm:grid-cols-3 md:justify-items-end">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#3a3a4a]">
                  {group.title}
                </h2>
                <div className="grid gap-3">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-[#3a3a4a] transition-colors hover:text-[#fffbf4]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="select-none py-10 text-center font-mono text-[clamp(48px,8vw,112px)] font-bold tracking-[0.3em] text-white/[0.04]">
          MOTIONCODE
        </div>

        <div className="flex flex-col gap-5 border-t border-[#1a1a1a] py-6 text-sm text-[#1a1a1a] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 MotionCode. All rights reserved.</p>
          <div className="flex gap-5 font-mono text-[11px] text-[#3a3a4a]">
            <Link href="/privacy" className="hover:text-[#00ff88]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#00ff88]">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
