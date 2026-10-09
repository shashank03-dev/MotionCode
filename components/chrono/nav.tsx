"use client";

import * as React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

import { MarketingAuthNavActions } from "@/components/marketing/auth-nav-actions";
import { timecode } from "@/lib/chrono/bezier";
import { cn } from "@/lib/utils";

import { Logo } from "./logo";

const LINKS = {
  landing: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how" },
    { label: "Pricing", href: "#pricing" },
    { label: "Support", href: "/support" },
  ],
  site: [
    { label: "Features", href: "/#features" },
    { label: "How it works", href: "/#how" },
    { label: "Pricing", href: "/pricing" },
    { label: "Support", href: "/support" },
  ],
} as const;

/**
 * Page reel readout — the document is treated as a 3-second reel and the
 * current scroll position is shown as a 24fps timecode. Written straight to
 * the DOM so scrolling never re-renders React.
 */
function ReelTimecode() {
  const ref = React.useRef<HTMLSpanElement>(null);
  const barRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (ref.current) ref.current.textContent = timecode(p);
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <span
      aria-hidden
      className="hidden items-center gap-2.5 font-mono text-[11px] tabular-nums tracking-[0.08em] text-ink-3 xl:inline-flex"
    >
      <span className="relative h-px w-10 overflow-hidden bg-hairline-strong">
        <span
          ref={barRef}
          className="absolute inset-0 origin-left bg-accent"
          style={{ transform: "scaleX(0)" }}
        />
      </span>
      <span>
        <span ref={ref} className="text-ink-2">
          00:00
        </span>
        <span className="opacity-60"> / 03:00</span>
      </span>
    </span>
  );
}

export function Nav({
  variant = "landing",
  position = "fixed",
}: {
  variant?: "landing" | "site";
  /** `fixed` floats over the landing hero; `sticky` takes up flow space. */
  position?: "fixed" | "sticky";
}) {
  const links = LINKS[variant];
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const menuId = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const close = () => setOpen(false);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className={cn(
        position === "fixed" ? "fixed inset-x-0 top-0" : "sticky top-0",
        "z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ease-expo",
        "border-b border-transparent",
        (scrolled || open) &&
          "border-hairline bg-carbon/75 backdrop-blur-xl backdrop-saturate-150",
      )}
    >
      <nav
        aria-label="Primary navigation"
        className="container-page relative flex h-16 items-center justify-between gap-3"
      >
        <Link
          href={variant === "landing" ? "#top" : "/"}
          aria-label="MotionCode home"
          className="flex min-h-[44px] shrink-0 items-center"
        >
          <Logo />
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="group relative inline-flex min-h-[44px] items-center px-3.5 text-[14px] text-ink-2 transition-colors duration-200 hover:text-ink"
            >
              {link.label}
              <span
                aria-hidden
                className="absolute inset-x-3.5 bottom-2.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-500 ease-expo group-hover:scale-x-100"
              />
            </Link>
          ))}
        </div>

        <div className="flex min-w-0 items-center gap-3">
          {variant === "landing" ? <ReelTimecode /> : null}
          <MarketingAuthNavActions variant={variant} />
          <button
            type="button"
            ref={triggerRef}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            aria-label={open ? "Close menu" : "Open menu"}
            className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-bone/[0.06] md:hidden"
          >
            <span aria-hidden className="relative block h-3 w-5">
              <span
                className={cn(
                  "absolute left-0 top-0 h-px w-5 bg-current transition-transform duration-500 ease-expo",
                  open && "translate-y-1.5 rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute bottom-0 left-0 h-px w-5 bg-current transition-transform duration-500 ease-expo",
                  open && "-translate-y-1.5 -rotate-45",
                )}
              />
            </span>
          </button>
        </div>

        {open ? (
          <div
            ref={menuRef}
            id={menuId}
            data-nav-menu
            className="absolute inset-x-0 top-full z-50 max-h-[calc(100dvh-80px)] overflow-y-auto border-b border-hairline bg-carbon px-[clamp(16px,4vw,40px)] pb-6 pt-2 md:hidden"
          >
            <div className="grid">
              {links.map((link, i) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={close}
                  className="group flex min-h-[56px] items-baseline justify-between border-b border-hairline py-3 text-[28px] font-medium tracking-[-0.04em] text-ink"
                  style={{ animation: `fade-up .6s var(--ease-out) ${i * 50}ms both` }}
                >
                  {link.label}
                  <span className="font-mono text-[11px] tracking-[0.12em] text-ink-3 transition-colors group-hover:text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-5">
              <MarketingAuthNavActions variant={variant} layout="menu" onNavigate={close} />
            </div>
          </div>
        ) : null}
      </nav>
      {open && typeof document !== "undefined"
        ? createPortal(
            <button
              type="button"
              aria-label="Close menu"
              tabIndex={-1}
              onClick={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
              className="fixed inset-0 z-40 bg-carbon/60 backdrop-blur-sm md:hidden"
            />,
            document.body,
          )
        : null}
    </header>
  );
}
