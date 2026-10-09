import { ArrowDown, ArrowRight } from "lucide-react";

import { ButtonLink } from "@/components/ui/site-button";

import { Chronograph } from "./chronograph";

/**
 * Plate 01. The headline sits over a live chronophotograph of a UI element
 * easing along its path; the pointer bends the curve. Server-rendered copy,
 * CSS-only intro (see `.rise` in globals.css) so the words paint with the
 * HTML and never wait on JavaScript.
 */
export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate flex min-h-[max(100svh,680px)] flex-col overflow-hidden"
    >
      <Chronograph className="-z-10" />

      <div className="container-page relative flex flex-1 flex-col pb-10 pt-28 sm:pt-32 lg:justify-center lg:pb-24">
        <p
          className="fade-rise inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2"
          style={{ ["--d" as string]: "0.05s" }}
        >
          <span className="size-1.5 rounded-full bg-accent" aria-hidden />
          Motion reference → production code
        </p>

        <h1 className="display-xl mt-7 max-w-[11ch]">
          <span className="rise">
            <span style={{ ["--d" as string]: "0.1s" }}>Motion,</span>
          </span>
          <span className="rise">
            <span className="serif-em pr-[0.08em] text-ink" style={{ ["--d" as string]: "0.2s" }}>
              decoded.
            </span>
          </span>
        </h1>

        <p
          className="fade-rise mt-8 max-w-[34rem] text-[17px] leading-[1.6] text-ink-2 sm:text-[18px]"
          style={{ ["--d" as string]: "0.35s" }}
        >
          Drop in a video or GIF of any interface animation. MotionCode reads
          the motion and hands back a normalized spec plus production code —
          CSS, GSAP and Framer Motion.
        </p>

        <div
          className="fade-rise mt-9 flex flex-wrap items-center gap-3"
          style={{ ["--d" as string]: "0.45s" }}
        >
          <ButtonLink href="/app" variant="primary" size="lg" className="group">
            Analyze a motion
            <ArrowRight className="size-4 transition-transform duration-500 ease-expo group-hover:translate-x-1" />
          </ButtonLink>
          <ButtonLink href="#playground" variant="outline" size="lg">
            See it work
          </ButtonLink>
        </div>

        <div
          className="fade-rise mt-auto hidden items-center gap-6 pt-16 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 lg:flex"
          style={{ ["--d" as string]: "0.6s" }}
        >
          <span className="inline-flex items-center gap-2">
            <ArrowDown className="size-3.5 animate-bounce text-ink-2" aria-hidden />
            Scroll to develop
          </span>
          <span className="h-px w-10 bg-hairline-strong" aria-hidden />
          <span>Plate 01 — move your cursor to bend the curve</span>
        </div>
      </div>
    </section>
  );
}
