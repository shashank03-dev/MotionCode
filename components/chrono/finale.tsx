"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { ButtonLink } from "@/components/ui/site-button";
import { bezierAt } from "@/lib/chrono/bezier";

/**
 * The closing plate bookends the hero: the same element, exposed across the
 * full width of the page. Scroll drives its travel, so the last thing you do
 * on the site is perform an expo-out yourself.
 */
const N = 13;

export function Finale() {
  const root = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const q = gsap.utils.selector(el);
    const ctx = gsap.context(() => {
      const nodes = q("[data-exposure]") as HTMLElement[];
      const state = { p: 0 };
      gsap.to(state, {
        p: 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 85%", end: "center 45%", scrub: 0.6 },
        onUpdate: () => {
          nodes.forEach((node, i) => {
            const t = i / (N - 1);
            const lit = t <= state.p + 1e-3;
            node.style.opacity = lit ? String(i === N - 1 ? 1 : 0.18 + t * 0.5) : "0";
            node.dataset.head = String(lit && (i === N - 1 || (i + 1) / (N - 1) > state.p + 1e-3));
          });
        },
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} className="relative overflow-hidden border-t border-hairline py-32 sm:py-44">
      <div className="pointer-events-none absolute inset-x-0 top-[18%] h-24" aria-hidden>
        <span className="absolute inset-x-[6%] top-1/2 h-px bg-hairline" />
        {Array.from({ length: N }, (_, i) => {
          const x = 6 + bezierAt([0.16, 1, 0.3, 1], i / (N - 1)) * 88;
          return (
            <span
              key={i}
              data-exposure
              data-head={i === N - 1}
              className="finale-exposure absolute top-1/2 size-[clamp(28px,4vw,56px)] -translate-x-1/2 -translate-y-1/2 rounded-[26%] border border-bone/40"
              style={{ left: `${x}%`, opacity: i === N - 1 ? 1 : 0.18 + (i / (N - 1)) * 0.5 }}
            />
          );
        })}
      </div>

      <div className="container-page relative pt-24 text-center">
        <span className="eyebrow">Ready when you are</span>
        <h2 className="display-xl mx-auto mt-6 max-w-[12ch]">
          Ship motion with <span className="serif-em">confidence.</span>
        </h2>
        <p className="mx-auto mt-8 max-w-md text-[17px] leading-relaxed text-ink-2">
          Your first analysis is free. Bring the clip you&apos;ve been
          eyeballing — leave with the spec and the code.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <ButtonLink href="/app" variant="primary" size="lg" className="group">
            Analyze a motion
            <ArrowRight className="size-4 transition-transform duration-500 ease-expo group-hover:translate-x-1" />
          </ButtonLink>
          <ButtonLink href="/pricing" variant="outline" size="lg">
            See pricing
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
