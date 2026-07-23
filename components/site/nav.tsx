"use client";

import * as React from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { NAV_LINKS } from "@/lib/content";
import { Logo } from "./logo";
import { ButtonLink } from "@/components/ui/site-button";
import { Magnetic } from "@/components/motion/magnetic-button";
import { cn } from "@/lib/utils";

export function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = React.useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={cn(
          "glass-pill relative flex w-full max-w-[1120px] items-center justify-between overflow-hidden rounded-full px-2.5 py-2 pl-4 transition-[background,box-shadow] duration-300 ease-expo",
          scrolled && "glass-pill--scrolled",
        )}
      >
        {/* diagonal glass sheen */}
        <span aria-hidden className="glass-sheen" />

        <a href="#top" aria-label="MotionCode home" className="relative">
          <Logo />
        </a>

        <div className="relative z-[1] hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-[14px] text-ink-2 transition-colors duration-200 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="relative z-[1] flex items-center gap-2">
          <a
            href="/login"
            className="hidden px-3 text-[14px] text-ink-2 transition-colors hover:text-ink sm:block"
          >
            Sign in
          </a>
          <Magnetic strength={0.25}>
            <ButtonLink href="/app" variant="primary" size="sm">
              Start analyzing
            </ButtonLink>
          </Magnetic>
        </div>
      </nav>
    </motion.header>
  );
}
