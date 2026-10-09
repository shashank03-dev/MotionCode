"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Develop-on-enter: content fades up once when it crosses into view. CSS does
 * the animating (`.reveal` in globals.css); this only flips `data-shown`.
 * Content is visible without JavaScript and under reduced motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [state, setState] = React.useState<"idle" | "armed" | "shown">("idle");

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    // Already on screen at mount (e.g. deep link) — leave it alone.
    if (rect.top < window.innerHeight * 0.92) return;
    setState("armed");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return React.createElement(
    Tag,
    {
      ref,
      className: cn("reveal", className),
      "data-reveal": state,
      style: { ["--reveal-delay" as string]: `${delay}s` },
    },
    children,
  );
}
