"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/site-button";
import { Magnetic } from "@/components/motion/magnetic-button";
import { viewportOnce } from "@/lib/motion";

export function CTA() {
  return (
    <section className="container-page py-20">
      <div className="relative overflow-hidden rounded-3xl border border-hairline bg-black px-6 py-20 text-center sm:py-28">
        {/* static field accent + accent underglow */}
        <div className="absolute inset-0 grid-fade opacity-50" aria-hidden />
        <div
          className="absolute inset-x-0 bottom-0 h-2/3"
          style={{
            background:
              "radial-gradient(60% 80% at 50% 100%, var(--accent-dim) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            className="mx-auto max-w-2xl text-4xl tracking-tight sm:text-6xl"
          >
            Ship motion with confidence.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
            className="mx-auto mt-5 max-w-md text-[17px] text-ink-2"
          >
            Turn your next motion reference into code you can trust — in the time it
            takes to watch the clip.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }}
            className="mt-9 flex flex-wrap justify-center gap-3"
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
        </div>
      </div>
    </section>
  );
}
