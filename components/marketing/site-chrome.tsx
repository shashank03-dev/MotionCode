import Link from "next/link";

import { Logo } from "@/components/site/logo";
import { MetalText } from "@/components/motion/metal-text-lazy";

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
      { href: "/refunds", label: "Cancellation & Refunds" },
      { href: "/shipping", label: "Shipping & Delivery" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        aria-label="Primary navigation"
        className="glass-pill relative flex w-full max-w-[1120px] items-center justify-between overflow-hidden rounded-full px-2.5 py-2 pl-4"
      >
        <span aria-hidden className="glass-sheen" />

        <Link href="/" aria-label="MotionCode home" className="relative z-[1]">
          <Logo />
        </Link>

        <div className="relative z-[1] hidden items-center gap-1 md:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-[14px] text-ink-2 transition-colors duration-200 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="relative z-[1] flex items-center gap-2">
          <MarketingAuthNavActions variant="site" />
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline bg-panel/40">
      <div className="container-page py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/">
              <Logo />
            </Link>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ink-2">
              From motion reference to production animation code. Precise,
              cinematic, honest to the source.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {["4 frameworks", "< 30s analysis", "open beta"].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-hairline px-3 py-1.5 font-mono text-[11px] text-ink-3"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
          {footerGroups.map((group) => (
            <div key={group.title}>
              <div className="eyebrow mb-4">{group.title}</div>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-ink-2 transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Oversized interactive brand mark — liquid metal reacts to the cursor */}
        <div className="mt-16 select-none">
          <MetalText
            text="MotionCode"
            interactive
            blue={0.5}
            className="block cursor-default font-display text-[19vw] font-medium leading-[0.85] tracking-tighter lg:text-[15rem]"
          />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
            © {new Date().getFullYear()} MotionCode · Made for motion
          </span>
          <div className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <Link href="/refunds" className="transition-colors hover:text-ink">
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
