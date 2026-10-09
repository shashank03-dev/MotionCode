import Link from "next/link";

import { Logo } from "./logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Overview", href: "/" },
      { label: "How it works", href: "/#how" },
      { label: "Pricing", href: "/pricing" },
      { label: "Analyze", href: "/app" },
    ],
  },
  {
    title: "Formats",
    links: [
      { label: "CSS", href: "/#playground" },
      { label: "GSAP", href: "/#playground" },
      { label: "Framer Motion", href: "/#playground" },
      { label: "Features", href: "/#features" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Support", href: "/support" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const LINK =
  "link-wipe text-[14px] text-ink-2 hover:text-ink max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center";

/** The wordmark as a final exposure: letters step up one frame at a time on hover. */
function Wordmark() {
  const word = "MotionCode";
  return (
    <div className="mt-20 select-none overflow-hidden [container-type:inline-size]" aria-hidden>
      <p className="footer-wordmark group/word flex cursor-default text-[22.2cqw] font-medium leading-[0.8] tracking-[-0.075em]">
        {word.split("").map((ch, i) => (
          <span
            key={i}
            className={i >= 6 ? "serif-em -ml-[0.01em] tracking-[-0.04em]" : undefined}
            style={{ transitionDelay: `${i * 28}ms` }}
          >
            {ch}
          </span>
        ))}
      </p>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-hairline">
      <div className="container-page pt-20">
        <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-ink-2">
              From motion reference to production animation code. Precise,
              cinematic, honest to the source.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="eyebrow mb-4">{col.title}</p>
              <ul className="space-y-3 max-sm:space-y-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Wordmark />

        <div className="flex flex-col items-start justify-between gap-4 border-t border-hairline py-6 sm:flex-row sm:items-center">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
            © {new Date().getFullYear()} MotionCode · Made for motion
          </span>
          <div className="flex flex-wrap items-center gap-5 gap-y-0 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
            {[
              ["Pricing", "/pricing"],
              ["Support", "/support"],
              ["Refunds", "/refunds"],
              ["Shipping", "/shipping"],
              ["Sign in", "/login"],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="transition-colors hover:text-ink max-sm:inline-flex max-sm:min-h-[44px] max-sm:items-center"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
