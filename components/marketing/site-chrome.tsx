import Link from "next/link";

import { Logo } from "@/components/site/logo";
import { MetalText } from "@/components/motion/metal-text-lazy";

export { SiteHeader } from "./site-header";

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
                      className="inline-block py-2 text-[14px] text-ink-2 transition-colors hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Oversized interactive brand mark — liquid metal reacts to the cursor.
            Sized against this container (cqw), not the viewport. */}
        <div className="mt-16 select-none [container-type:inline-size]">
          <MetalText
            text="MotionCode"
            interactive
            blue={0.5}
            className="block cursor-default font-display text-[20.3cqw] font-medium leading-[0.85] tracking-tighter"
          />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-hairline pt-6 sm:flex-row sm:items-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
            © {new Date().getFullYear()} MotionCode · Made for motion
          </span>
          <div className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
            <Link
              href="/privacy"
              className="inline-block py-2 transition-colors hover:text-ink"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="inline-block py-2 transition-colors hover:text-ink"
            >
              Terms
            </Link>
            <Link
              href="/refunds"
              className="inline-block py-2 transition-colors hover:text-ink"
            >
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
