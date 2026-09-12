import Link from "next/link";
import { Logo } from "./logo";
import { MetalText } from "@/components/motion/metal-text-lazy";

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
      { label: "CSS", href: "/app" },
      { label: "GSAP", href: "/app" },
      { label: "Framer Motion", href: "/app" },
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


export function Footer() {
  return (
    <footer className="border-t border-hairline bg-panel/40">
      <div className="container-page py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ink-2">
              From motion reference to production animation code. Precise,
              cinematic, honest to the source.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="eyebrow mb-4">{col.title}</div>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
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

        {/* Oversized interactive brand mark - liquid metal reacts to the cursor.
            Sized against this container (cqw), not the viewport: the wordmark
            renders at 5.12x its font-size, so the old `lg:text-[15rem]` (240px)
            overflowed the 1200px container by a few pixels and clipped the
            final "e". Container units keep it flush at every width. */}
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
              href="/pricing"
              className="inline-block py-2 transition-colors hover:text-ink"
            >
              Pricing
            </Link>
            <Link
              href="/support"
              className="inline-block py-2 transition-colors hover:text-ink"
            >
              Support
            </Link>
            <Link
              href="/login"
              className="inline-block py-2 transition-colors hover:text-ink"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
