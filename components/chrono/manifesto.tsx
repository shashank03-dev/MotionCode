"use client";

import * as React from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { bezierAt } from "@/lib/chrono/bezier";

/**
 * Plate 03 — the one paper plate on the page. A scroll-developed statement:
 * each word comes up out of the paper like an image in the developer tray.
 * Above it, a strip of exposures re-spaces itself as you scroll — the same
 * twelve samples, eased from linear to expo-out.
 */

const LINES: { text: string; em?: boolean }[] = [
  { text: "Every interface moves. Most of that motion is" },
  { text: "guessed", em: true },
  {
    text: "— eyeballed from a screen recording, retyped by hand, and lost somewhere between design and code. MotionCode measures it instead: frame by frame, curve by curve, until the motion you saw is the motion you ship.",
  },
];

const BARS = 14;

export function Manifesto() {
  const root = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const q = gsap.utils.selector(el);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        q("[data-word]"),
        { opacity: 0.12 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.05,
          scrollTrigger: { trigger: q("[data-words]")[0], start: "top 78%", end: "bottom 45%", scrub: 0.5 },
        },
      );

      const bars = q("[data-bar]");
      const state = { k: 0 };
      gsap.to(state, {
        k: 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 80%", end: "center 40%", scrub: 0.5 },
        onUpdate: () => {
          bars.forEach((bar, i) => {
            const t = i / (BARS - 1);
            const eased = bezierAt([0.16, 1, 0.3, 1], t);
            const x = (t + (eased - t) * state.k) * 100;
            (bar as HTMLElement).style.left = `${x}%`;
          });
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="plate-paper relative overflow-hidden py-28 sm:py-36" aria-label="Manifesto">
      <div className="container-page">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
          <span>Plate 03 — Manifesto</span>
          <span className="hidden sm:inline">Developed on scroll</span>
        </div>

        <div className="relative mt-8 h-16 border-y border-hairline" aria-hidden>
          {Array.from({ length: BARS }, (_, i) => {
            const t = i / (BARS - 1);
            return (
              <span
                key={i}
                data-bar
                className="absolute top-1/2 h-9 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-paper-ink"
                style={{ left: `${t * 100}%`, opacity: i === BARS - 1 ? 1 : 0.25 + t * 0.6 }}
              />
            );
          })}
          <span className="absolute right-0 top-1/2 size-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-accent" />
        </div>

        <p
          data-words
          className="mt-16 max-w-[22ch] text-[clamp(2rem,5.2vw,4.6rem)] font-medium leading-[1.02] tracking-[-0.045em] sm:max-w-[24ch]"
        >
          {LINES.map((line, li) =>
            line.text.split(" ").map((word, wi) => {
              return (
                <React.Fragment key={`${li}-${wi}`}>
                  <span data-word className={line.em ? "serif-em text-accent" : undefined}>
                    {word}
                  </span>{" "}
                </React.Fragment>
              );
            }),
          )}
        </p>

        <div className="mt-16 grid gap-8 border-t border-hairline pt-8 sm:grid-cols-3">
          {[
            ["Up to 16", "key frames sampled per analysis"],
            ["1 spec", "duration, easing and keyframes, normalized"],
            ["3 targets", "CSS, GSAP and Framer Motion"],
          ].map(([figure, caption]) => (
            <div key={figure}>
              <p className="text-[clamp(2rem,3.4vw,3rem)] font-medium tracking-[-0.05em]">{figure}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2">{caption}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
