"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/site-button";
import { Magnetic } from "@/components/motion/magnetic-button";
import { Eyebrow } from "@/components/ui/kit";
import { viewportOnce } from "@/lib/motion";

const EASE = [0.2, 0.8, 0.2, 1] as const;

/**
 * Closing call to action.
 *
 * This was a flat `bg-black` panel with a hairline border - it did not use the
 * site's glass language at all, which is why it read as an empty rectangle
 * rather than a surface. It now composes `glass-card` + `glass-sheen`, the same
 * primitives the rest of the product uses, so the panel has real depth:
 * backdrop blur, a lit top edge, a gradient-masked border, and a slow specular
 * sweep.
 *
 * The background motif is the product's own subject matter - an easing curve
 * that draws itself as the section arrives, endpoints marked like the logo. It
 * gives the negative space a reason to exist instead of padding it out.
 */
export function CTA() {
  const reduceMotion = useReducedMotion();

  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: viewportOnce,
          transition: { duration: 0.6, ease: EASE, delay },
        };

  return (
    <section className="container-page py-20">
      <div className="glass-card relative overflow-hidden rounded-3xl px-6 py-20 text-center sm:py-24">
        {/* Depth stack, back to front: field texture, accent underglow pooled
            at the base, the easing-curve motif, then the moving sheen. */}
        <div className="absolute inset-0 grid-fade opacity-40" aria-hidden />
        <div
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{
            background:
              "radial-gradient(58% 78% at 50% 100%, var(--accent-dim) 0%, transparent 72%)",
          }}
          aria-hidden
        />

        <EasingMotif reduceMotion={Boolean(reduceMotion)} />

        <div className="glass-sheen" aria-hidden />

        <div className="relative">
          <motion.div {...rise(0)}>
            <Eyebrow dot>Ready when you are</Eyebrow>
          </motion.div>

          <motion.h2
            {...rise(0.08)}
            className="mx-auto mt-5 max-w-2xl font-display text-4xl font-medium leading-[1.02] tracking-tightest text-balance sm:text-6xl"
          >
            Ship motion with confidence.
          </motion.h2>

          <motion.p
            {...rise(0.16)}
            className="mx-auto mt-5 max-w-md text-[17px] leading-7 text-ink-2 text-pretty"
          >
            Turn your next motion reference into code you can trust - in the time
            it takes to watch the clip.
          </motion.p>

          <motion.div
            {...rise(0.24)}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Magnetic>
              <ButtonLink href="/login" variant="primary" size="lg">
                Analyze a motion
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </Magnetic>
            <ButtonLink href="#how" variant="frosted" size="lg">
              See how it works
            </ButtonLink>
          </motion.div>

          <motion.p
            {...rise(0.32)}
            className="mt-7 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3"
          >
            No card required · CSS · GSAP · Framer Motion
          </motion.p>
        </div>
      </div>
    </section>
  );
}

/**
 * The easing curve behind the copy. Wide and faint so it reads as texture
 * rather than a chart, with the two sampled endpoints marked - the same motif
 * as the logo mark.
 */
function EasingMotif({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    // Anchored to the lower half rather than centred: crossing the headline
    // mid-word read as an accident, whereas sweeping beneath the copy reads as
    // ground the buttons sit on.
    <svg
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] w-full"
      viewBox="0 0 1200 220"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient
          id="cta-ease"
          x1="0"
          y1="0"
          x2="1200"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.38" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <motion.path
        d="M0 190 C 320 190, 360 30, 600 30 S 880 190, 1200 30"
        stroke="url(#cta-ease)"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={reduceMotion ? undefined : { pathLength: 0 }}
        whileInView={reduceMotion ? undefined : { pathLength: 1 }}
        viewport={viewportOnce}
        transition={{ duration: 1.6, ease: EASE }}
      />

      <circle cx="2" cy="190" r="3" fill="var(--accent)" fillOpacity="0.3" />
      <circle cx="1198" cy="30" r="3" fill="var(--accent)" fillOpacity="0.3" />
    </svg>
  );
}
