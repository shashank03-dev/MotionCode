"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import { STEPS } from "@/lib/content";
import { SNIPPETS } from "@/lib/snippets";
import { Filmstrip } from "@/components/motion/filmstrip";
import { MotionCurve } from "@/components/motion/motion-curve";
import { CodePaper } from "@/components/motion/code-paper";
import { Reveal } from "@/components/motion/scroll-reveal";
import { cn } from "@/lib/utils";

/** The visual stage for a single beat. */
function BeatVisual({ index }: { index: number }) {
  if (index === 0) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-hairline bg-black">
        <div className="absolute inset-0 grid-fade opacity-50" />
        <motion.div
          className="absolute left-1/2 h-12 w-12 -translate-x-1/2 rounded-xl bg-white shadow-[0_0_30px_var(--accent-glow)]"
          animate={{ top: ["64%", "24%", "64%"] }}
          transition={{ duration: 2.6, ease: [0.2, 0.8, 0.2, 1], repeat: Infinity }}
        />
        <span className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
          reference.mp4
        </span>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="grid gap-3 rounded-2xl border border-hairline bg-panel/60 p-4">
        <Filmstrip frames={7} />
        <div className="rounded-xl border border-hairline bg-black/50 p-2">
          <MotionCurve className="h-[170px] w-full" />
        </div>
      </div>
    );
  }
  return (
    <CodePaper
      code={SNIPPETS[2].code}
      filename={SNIPPETS[2].filename}
      animateLines={false}
    />
  );
}

function BeatText({ index, active }: { index: number; active: boolean }) {
  const step = STEPS[index];
  return (
    <div
      className={cn(
        "transition-opacity duration-300",
        active ? "opacity-100" : "opacity-40",
      )}
    >
      <div className="eyebrow mb-4">{step.kicker}</div>
      <h3 className="max-w-sm text-3xl tracking-tight sm:text-4xl">{step.title}</h3>
      <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-ink-2">
        {step.body}
      </p>
    </div>
  );
}

export function HowItWorks() {
  const root = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: root,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0.06, 0.94], ["0%", "-66.666%"]);
  const [active, setActive] = React.useState(0);
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setActive(p < 0.36 ? 0 : p < 0.68 ? 1 : 2);
  });

  return (
    <>
      {/* Pinned horizontal sequence — large screens */}
      <section
        id="how"
        ref={root}
        className="relative hidden lg:block"
        style={{ height: "320vh" }}
      >
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          <div className="container-page mb-8 flex items-end justify-between">
            <div>
              <div className="eyebrow mb-3">How it works</div>
              <h2 className="text-4xl tracking-tight">From reference to shipped, in one pass</h2>
            </div>
            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    i === active ? "w-8 bg-accent" : "w-4 bg-white/15",
                  )}
                />
              ))}
            </div>
          </div>

          <motion.div style={{ x }} className="flex w-[300%]">
            {STEPS.map((_, i) => (
              <div key={i} className="w-1/3 shrink-0">
                <div className="container-page grid grid-cols-2 items-center gap-10">
                  <BeatText index={i} active={active === i} />
                  <div>
                    <BeatVisual index={i} />
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stacked fallback — small screens & reduced motion */}
      <section className="container-page space-y-16 py-20 lg:hidden">
        <div>
          <div className="eyebrow mb-3">How it works</div>
          <h2 className="text-4xl tracking-tight">From reference to shipped</h2>
        </div>
        {STEPS.map((step, i) => (
          <Reveal key={i} className="grid gap-6">
            <div>
              <div className="eyebrow mb-3">{step.kicker}</div>
              <h3 className="text-3xl tracking-tight">{step.title}</h3>
              <p className="mt-3 max-w-md text-ink-2">{step.body}</p>
            </div>
            <BeatVisual index={i} />
          </Reveal>
        ))}
      </section>
    </>
  );
}
