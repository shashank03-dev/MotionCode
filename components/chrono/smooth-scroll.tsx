"use client";

import * as React from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Weighted smooth scrolling for the marketing pages, driven from GSAP's ticker
 * so ScrollTrigger always samples the same scroll position Lenis just painted.
 *
 * - One loop: Lenis runs with `autoRaf: false`; gsap.ticker calls `raf`.
 * - Reduced motion: never instantiated, native scrolling only.
 * - Touch: Lenis leaves native touch scrolling alone (`syncTouch` off).
 * - In-page anchors (`href="#…"`) are routed through Lenis so they glide and
 *   stay in sync with pinned sections.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({
      autoRaf: false,
      lerp: 0.11,
      wheelMultiplier: 0.95,
      anchors: { offset: -72 },
    });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // A deep link (e.g. /#how) landed before Lenis existed — re-resolve it
    // once pins have measured so the target isn't offset by pin spacers.
    const hash = window.location.hash;
    let raf = 0;
    if (hash.length > 1) {
      raf = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        const el = document.querySelector(hash);
        if (el) instance.scrollTo(el as HTMLElement, { immediate: true, offset: -72 });
      });
    }

    return () => {
      cancelAnimationFrame(raf);
      gsap.ticker.remove(tick);
      instance.destroy();
    };
  }, []);

  return <>{children}</>;
}
