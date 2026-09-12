"use client";

import * as React from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/content";
import { Logo } from "./logo";
import { ButtonLink } from "@/components/ui/site-button";
import { Magnetic } from "@/components/motion/magnetic-button";
import { cn } from "@/lib/utils";

export function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const menuId = React.useId();
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open ]);

  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
  }, [open]);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={cn(
          "glass-pill relative flex w-full max-w-[1120px] items-center justify-between gap-2 rounded-full px-2.5 py-2 pl-4 transition-[background,box-shadow] duration-300 ease-expo",
          scrolled && "glass-pill--scrolled",
        )}
      >
        {/* diagonal glass sheen */}
        <span aria-hidden className="glass-sheen" />

        <a
          href="#top"
          aria-label="MotionCode home"
          className="relative z-[1] flex shrink-0 items-center"
        >
          <Logo />
        </a>

        <div className="relative z-[1] hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="inline-flex min-h-[44px] items-center rounded-full px-3.5 text-[14px] text-ink-2 transition-colors duration-200 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="relative z-[1] flex min-w-0 items-center gap-2">
          <a
            href="/login"
            className="hidden min-h-[44px] items-center px-3 text-[14px] text-ink-2 transition-colors hover:text-ink sm:inline-flex"
          >
            Sign in
          </a>
          <Magnetic strength={0.25}>
            <ButtonLink href="/app" variant="primary" size="sm">
              Start analyzing
            </ButtonLink>
          </Magnetic>
          <button
            type="button"
            ref={triggerRef}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-hairline text-ink-2 transition-colors hover:border-accent-border hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:hidden"
          >
            {open ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {open ? (
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />
            <div
              ref={menuRef}
              id={menuId}
              className="glass-card absolute inset-x-0 top-[calc(100%+8px)] z-50 max-h-[calc(100dvh-96px)] overflow-y-auto rounded-2xl p-2 md:hidden"
            >
            <div className="grid gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-[15px] text-ink-2 transition-colors hover:bg-white/[0.04] hover:text-ink"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="mt-2 grid gap-1 border-t border-hairline pt-2">
              <a
                href="/login"
                onClick={() => setOpen(false)}
                className="inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-[15px] text-ink-2 transition-colors hover:bg-white/[0.04] hover:text-ink sm:hidden"
              >
                Sign in
              </a>
              <ButtonLink
                href="/app"
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Start analyzing
              </ButtonLink>
            </div>
            </div>
          </>
        ) : null}
      </nav>
    </motion.header>
  );
}
