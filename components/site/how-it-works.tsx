"use client";

import * as React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
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

// The background reads as a motion-lab timeline: a frame ruler the section
// scrolls along, an easing curve that draws across it, keyframe markers on each
// beat, and a single accent playhead locked to scroll. viewBox coordinates for
// the easing curve — an ease-in-out S from bottom-left to top-right, the
// product's own visual language.
const CURVE_VB = { w: 1000, h: 220 } as const;
const CURVE_D = `M0,${CURVE_VB.h - 26} C 360,${CURVE_VB.h - 26} 600,26 1000,26`;
const KEY_X = [180, 500, 820]; // viewBox x of the three keyframes
const TOTAL_FRAMES = 72; // 3s @ 24fps — the timecode scale

const pad = (n: number) => String(n).padStart(2, "0");
const timecode = (p: number) => {
  const f = Math.round(Math.min(Math.max(p, 0), 1) * TOTAL_FRAMES);
  return `${pad(Math.floor(f / 24))}:${pad(f % 24)}`;
};

/**
 * Motion-lab instrumentation behind the pinned beats. Pure SVG/DOM — no second
 * WebGL context — so it also carries the section under reduced-motion / no-WebGL
 * where the contour shader bails. The accent playhead is the one bright element;
 * everything else stays hairline-quiet so it never fights the foreground cards.
 */
function MotionTimeline({
  progress,
  active,
}: {
  progress: MotionValue<number>;
  active: number;
}) {
  const reduce = useReducedMotion();
  const pathRef = React.useRef<SVGPathElement>(null);
  const [keys, setKeys] = React.useState<{ x: number; y: number }[]>([]);

  // Playhead sweeps across the stage; a small parallax drift on the instrument
  // makes it sit a plane behind the cards. Curve draws on across the first pass.
  const playheadLeft = useTransform(progress, [0.04, 0.96], ["7%", "93%"]);
  const drift = useTransform(progress, [0, 1], [24, -24]);
  const drawMv = useTransform(progress, [0.05, 0.72], [0, 1]);
  const [tc, setTc] = React.useState("00:00");
  useMotionValueEvent(progress, "change", (p) => setTc(timecode(p)));

  // Sample the curve once so keyframe diamonds sit exactly on it. Done in
  // viewBox space, then rendered as HTML (crisp) rather than inside the
  // non-uniformly-scaled SVG (which would distort the diamonds).
  React.useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    if (!len) return;
    const N = 320;
    const pts = Array.from({ length: N + 1 }, (_, i) =>
      path.getPointAtLength((i / N) * len),
    );
    setKeys(
      KEY_X.map((tx) => {
        let best = pts[0];
        for (const pt of pts)
          if (Math.abs(pt.x - tx) < Math.abs(best.x - tx)) best = pt;
        return { x: best.x, y: best.y };
      }),
    );
  }, []);

  const edgeMask =
    "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)";

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      {/* instrument plane — drifts slightly for parallax depth */}
      <motion.div className="absolute inset-0" style={{ x: reduce ? 0 : drift }}>
        {/* easing curve + fill, drawn in the mid band */}
        <div
          className="absolute inset-x-0 top-[40%] h-[34%]"
          style={{ WebkitMaskImage: edgeMask, maskImage: edgeMask }}
        >
          <svg
            viewBox={`0 0 ${CURVE_VB.w} ${CURVE_VB.h}`}
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <defs>
              <linearGradient id="how-curve-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--accent)" stopOpacity="0.16" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d={`${CURVE_D} L1000,${CURVE_VB.h} L0,${CURVE_VB.h} Z`}
              fill="url(#how-curve-fill)"
              style={{ opacity: reduce ? 1 : drawMv }}
            />
            <motion.path
              ref={pathRef}
              d={CURVE_D}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={1.5}
              strokeOpacity={0.75}
              vectorEffect="non-scaling-stroke"
              style={{ pathLength: reduce ? 1 : drawMv }}
            />
          </svg>
        </div>

        {/* keyframe diamonds sitting on the curve; the active one lights up */}
        <div
          className="absolute inset-x-0 top-[40%] h-[34%]"
          style={{ WebkitMaskImage: edgeMask, maskImage: edgeMask }}
        >
          {keys.map((k, i) => (
            <span
              key={i}
              className={cn(
                "absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] border transition-all duration-300",
                i === active
                  ? "border-accent bg-accent shadow-[0_0_14px_var(--accent-glow)]"
                  : "border-white/25 bg-transparent",
              )}
              style={{
                left: `${(k.x / CURVE_VB.w) * 100}%`,
                top: `${(k.y / CURVE_VB.h) * 100}%`,
              }}
            />
          ))}
        </div>

        {/* frame ruler with timecodes near the lower third */}
        <div
          className="absolute inset-x-0 top-[80%]"
          style={{ WebkitMaskImage: edgeMask, maskImage: edgeMask }}
        >
          <div className="relative h-px w-full bg-hairline" />
          <div
            className="h-2 w-full opacity-70"
            style={{
              background:
                "repeating-linear-gradient(to right, var(--hairline-strong) 0 1px, transparent 1px 40px)",
              WebkitMaskImage: "linear-gradient(to bottom, #000, transparent)",
              maskImage: "linear-gradient(to bottom, #000, transparent)",
            }}
          />
          <div className="relative mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i}>{timecode(i / 6)}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* the one bright element: accent playhead, locked to scroll */}
      <motion.div
        className="absolute inset-y-[14%] w-px"
        style={{ left: reduce ? "50%" : playheadLeft }}
      >
        <div className="absolute inset-0 w-px bg-accent shadow-[0_0_12px_var(--accent-glow)]" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-md border border-accent-border bg-black/70 px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] text-accent backdrop-blur-sm">
          {reduce ? "00:36" : tc}
        </div>
        <span className="absolute left-1/2 top-[66%] h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_10px_var(--accent-glow)]" />
      </motion.div>
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
          <MotionTimeline progress={scrollYProgress} active={active} />
          <div className="container-page relative z-10 mb-8 flex items-end justify-between">
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

          <motion.div style={{ x }} className="relative z-10 flex w-[300%]">
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
