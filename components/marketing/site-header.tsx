"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/site/logo";

import { MarketingAuthNavActions } from "./auth-nav-actions";

const primaryLinks = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/support", label: "Support" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        aria-label="Primary navigation"
        className="glass-pill relative flex w-full max-w-[1120px] items-center justify-between gap-2 rounded-full px-2.5 py-2 pl-4"
      >
        <span aria-hidden className="glass-sheen" />

        <Link
          href="/"
          aria-label="MotionCode home"
          className="relative z-[1] flex min-w-0 shrink items-center"
        >
          <Logo className="min-w-0 [&>span:last-child]:min-w-0 [&>span:last-child]:truncate" />
        </Link>

        <div className="relative z-[1] hidden items-center gap-1 md:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-[44px] items-center rounded-full px-3.5 py-1.5 text-[14px] text-ink-2 transition-colors duration-200 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="relative z-[1] flex min-w-0 items-center gap-2">
          <MarketingAuthNavActions variant="site" />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={menuId}
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
          <div
            id={menuId}
            className="glass-card absolute inset-x-0 top-[calc(100%+8px)] z-50 rounded-2xl p-2 md:hidden"
          >
            <div className="grid gap-1">
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-[15px] text-ink-2 transition-colors hover:bg-white/[0.04] hover:text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div
              className="mt-2 border-t border-hairline pt-2"
              onClick={() => setOpen(false)}
            >
              <MarketingAuthNavActions variant="site" layout="menu" />
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
