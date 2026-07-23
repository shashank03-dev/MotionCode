"use client";

import { motion } from "framer-motion";
import { FEATURES } from "@/lib/content";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Features() {
  return (
    <section id="features" className="container-page scroll-mt-24 py-24 sm:py-28">
      <div className="mb-14 max-w-2xl">
        <div className="eyebrow mb-4">Capabilities</div>
        <h2 className="text-4xl tracking-tight sm:text-5xl">
          Everything between a clip and clean code
        </h2>
        <p className="mt-4 max-w-lg text-[17px] text-ink-2">
          MotionCode does the tedious part — reading motion frame by frame — so the
          spec you ship is precise, portable and honest to the source.
        </p>
      </div>

      <motion.div
        variants={staggerContainer(0.07)}
        initial="hidden"
        whileInView="show"
        viewport={viewportOnce}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((f) => (
          <motion.article
            key={f.title}
            variants={fadeUp}
            className={cn(
              "glass-card group relative overflow-hidden rounded-2xl p-6 transition-colors duration-300 hover:border-[var(--accent-border)]",
              f.span === "wide" && "sm:col-span-2",
              f.span === "tall" && "lg:row-span-2",
            )}
          >
            {/* hover glow */}
            <div className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(400px_200px_at_var(--x,50%)_0%,var(--accent-dim),transparent)]" />
            <div className="relative">
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-black/40 text-accent">
                <f.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </div>
              <h3 className="text-xl tracking-tight">{f.title}</h3>
              <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed text-ink-2">
                {f.body}
              </p>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
