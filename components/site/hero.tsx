"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { ButtonLink } from "@/components/ui/site-button";
import { Badge } from "@/components/ui/badge";
import { Magnetic } from "@/components/motion/magnetic-button";
import dynamic from "next/dynamic";
import { ArtifactPanel } from "./artifact-panel";
import { EASE } from "@/lib/motion";

/**
 * The cursor aura is a WebGL (`ogl`) flourish bound to the hero. It carries no
 * content and affects no layout, so it loads lazily rather than putting the
 * whole renderer on the landing page's critical path — pointer-driven decoration
 * that nobody sees until they move the mouse should not gate first paint.
 */
const AuraCursor = dynamic(
  () => import("@/components/motion/aura-cursor").then((m) => m.AuraCursor),
  { ssr: false },
);

const words = ["Motion,", "decoded."];

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-36 pb-20 sm:pt-40 lg:pt-44"
    >
      {/* Cursor aura — bounded to the hero so it scrolls with the section and
          never smears across the rest of the page. */}
      <AuraCursor />

      <div className="container-page relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          {/* copy */}
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Badge dot className="mb-6">
                Motion reference → production code
              </Badge>
            </motion.div>

            <h1 className="text-[15vw] leading-[0.9] tracking-tightest sm:text-7xl lg:text-[5.4rem]">
              {words.map((w, i) => (
                <span key={w} className="block overflow-hidden">
                  <motion.span
                    className="block text-gradient-ink"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{
                      duration: 0.85,
                      ease: EASE,
                      delay: 0.1 + i * 0.09,
                    }}
                  >
                    {w}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}
              className="mt-6 max-w-md text-[17px] leading-relaxed text-ink-2"
            >
              Drop in a video or GIF of any interface animation. MotionCode reads
              the motion and hands back a normalized spec plus production code —
              CSS, GSAP and Framer Motion.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Magnetic>
                <ButtonLink href="/app" variant="primary" size="lg">
                  Analyze a motion
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </Magnetic>
              <ButtonLink href="#playground" variant="frosted" size="lg">
                <Play className="h-4 w-4" />
                See it work
              </ButtonLink>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3"
            >
              <span>CSS</span>
              <span className="h-3 w-px bg-hairline" />
              <span>GSAP</span>
              <span className="h-3 w-px bg-hairline" />
              <span>Framer Motion</span>
            </motion.div>
          </div>

          {/* live artifact */}
          <ArtifactPanel />
        </div>
      </div>
    </section>
  );
}
