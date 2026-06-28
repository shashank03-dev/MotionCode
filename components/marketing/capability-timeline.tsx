"use client";

import React, { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DecryptedText } from "@/components/react-bits";
import styles from "./capability-timeline.module.css";

gsap.registerPlugin(ScrollTrigger);

/* The five things one analysis returns, laid out as positions on a motion
   timeline (0 -> 640ms). Each has a `kind` that selects its signature
   visualization. Copy names what the user gets, not how the engine works. */
type CapabilityKind = "frames" | "curve" | "export" | "score" | "a11y";

type Capability = {
  id: string;
  ms: number;
  frame: string;
  title: string;
  body: string;
  kind: CapabilityKind;
};

const CAPABILITIES: Capability[] = [
  {
    id: "decode",
    ms: 0,
    frame: "00ms · source",
    title: "Decode the source",
    body: "Drop an MP4, WebM, GIF, or Lottie file. MotionCode samples frames at the cadence the original played.",
    kind: "frames",
  },
  {
    id: "curve",
    ms: 160,
    frame: "160ms · motion",
    title: "Read the curve",
    body: "Sampled frames resolve into keyframes, transform paths, and the exact easing the motion follows.",
    kind: "curve",
  },
  {
    id: "export",
    ms: 320,
    frame: "320ms · export",
    title: "Export to your stack",
    body: "Copy CSS, GSAP, or Framer Motion that carries the same numbers, in the syntax you already write.",
    kind: "export",
  },
  {
    id: "score",
    ms: 480,
    frame: "480ms · render",
    title: "Score the render",
    body: "Each export is measured for repaints and compositor layers, then scored so you ship transforms, not jank.",
    kind: "score",
  },
  {
    id: "guard",
    ms: 640,
    frame: "640ms · access",
    title: "Keep it accessible",
    body: "Reduced-motion fallbacks and WCAG AA contrast checks ride along with every snippet you export.",
    kind: "a11y",
  },
];

const TICKS = CAPABILITIES.map((c) => c.ms);
const SCORE_TARGET = 94;
// Per-framework coverage shown as bar fills (0-1). Distinct, not uniform.
const EXPORT_ROWS: Array<{ label: string; state: string; fill: number }> = [
  { label: "CSS", state: "ready", fill: 0.96 },
  { label: "GSAP", state: "spring", fill: 0.82 },
  { label: "Framer", state: "mapped", fill: 1 },
];
const FRAME_LABELS = ["00", "04", "08", "12", "16", "20", "24"];
// Cubic-bezier easing trace; node coords lie on the path so the static (no-JS)
// render already shows nodes sitting on a fully drawn curve.
const CURVE_PATH = "M3,55 C 38,55 34,7 97,7";
const CURVE_NODES = [
  { x: 3, y: 55 },
  { x: 28.7, y: 42.8 },
  { x: 51.8, y: 19.9 },
  { x: 97, y: 7 },
];

const GAUGE_R = 40;
const GAUGE_CIRC = 2 * Math.PI * GAUGE_R;

const pad = (n: number) => String(n).padStart(2, "0");

function Signature({ kind }: { kind: CapabilityKind }) {
  if (kind === "frames") {
    return (
      <div className={styles.stage}>
        <div className={styles.frames} aria-hidden="true">
          {FRAME_LABELS.map((label) => (
            <span key={label} className={styles.frame} data-frame>
              {label}
            </span>
          ))}
        </div>
        <div className={styles.framesCaption}>
          7 frames sampled · <b>cadence locked</b>
        </div>
      </div>
    );
  }

  if (kind === "curve") {
    return (
      <div className={styles.stage}>
        <div className={styles.curveWrap}>
          <svg
            className={styles.curveSvg}
            viewBox="0 0 100 62"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <line className={styles.curveGuide} x1="3" y1="55" x2="3" y2="62" />
            <line className={styles.curveGuide} x1="97" y1="7" x2="97" y2="62" />
            <path className={styles.curveTrace} d={CURVE_PATH} data-trace />
            {CURVE_NODES.map((node) => (
              <circle
                key={`${node.x}-${node.y}`}
                className={styles.curveNode}
                cx={node.x}
                cy={node.y}
                r={2.6}
                data-node
              />
            ))}
          </svg>
        </div>
        <div className={styles.curveReadout}>
          <span>ease</span>
          <b>cubic-bezier(.34, 1.2, .64, 1)</b>
        </div>
      </div>
    );
  }

  if (kind === "export") {
    return (
      <div className={styles.stage}>
        <div className={styles.exports}>
          {EXPORT_ROWS.map((row) => (
            <div
              key={row.label}
              className={styles.exportRow}
              data-export-row
              data-done="true"
            >
              <span>{row.label}</span>
              <span className={styles.exportTrack}>
                <span
                  className={styles.exportFill}
                  data-fill
                  style={
                    { "--mc-fill": row.fill } as React.CSSProperties
                  }
                />
              </span>
              <span className={styles.exportState}>{row.state}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "score") {
    return (
      <div className={styles.stage}>
        <div className={styles.gauge}>
          <div className={styles.gaugeDial}>
            <svg viewBox="0 0 92 92" aria-hidden="true">
              <circle className={styles.gaugeTrackRing} cx="46" cy="46" r={GAUGE_R} />
              <circle
                className={styles.gaugeValueRing}
                cx="46"
                cy="46"
                r={GAUGE_R}
                data-gauge-ring
                style={{
                  strokeDasharray: GAUGE_CIRC,
                  strokeDashoffset: GAUGE_CIRC * (1 - SCORE_TARGET / 100),
                }}
              />
            </svg>
            <div className={styles.gaugeNumber} data-gauge-number>
              {SCORE_TARGET}
            </div>
          </div>
          <div className={styles.gaugeMeta}>
            <span>
              render score <b>/ 100</b>
            </span>
            <span>0 dropped frames</span>
            <span>compositor-only</span>
          </div>
        </div>
      </div>
    );
  }

  // a11y
  return (
    <div className={styles.stage}>
      <div className={styles.a11y}>
        <div className={styles.switch}>
          <span>prefers-reduced-motion</span>
          <span className={styles.switchTrack} aria-hidden="true" />
        </div>
        <div className={styles.checkRow}>
          <Check size={14} strokeWidth={2.5} aria-hidden="true" />
          <span>WCAG AA contrast</span>
        </div>
        <div className={styles.checkRow}>
          <Check size={14} strokeWidth={2.5} aria-hidden="true" />
          <span>Keyboard focus order</span>
        </div>
      </div>
    </div>
  );
}

export default function CapabilityTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const ticksRef = useRef<(HTMLElement | null)[]>([]);
  const dotsRef = useRef<(HTMLElement | null)[]>([]);
  const frameReadoutRef = useRef<HTMLElement>(null);
  const stepReadoutRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track) return;

    const n = CAPABILITIES.length;
    const lastFeatureIndex = n - 1;

    const mm = gsap.matchMedia();

    mm.add(
      {
        isDesktop: "(min-width: 768px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const conditions = ctx.conditions as {
          isDesktop: boolean;
          reduce: boolean;
        };
        const cards = cardsRef.current.filter(Boolean) as HTMLElement[];

        // Static layout (mobile or reduced motion): every card and viz stays in
        // its finished, visible state. Nothing to drive.
        if (!conditions.isDesktop || conditions.reduce) {
          section.dataset.mode = "static";
          cards.forEach((card) => {
            card.dataset.active = "true";
          });
          ticksRef.current.forEach((tick) => {
            if (tick) tick.dataset.live = "true";
          });
          dotsRef.current.forEach((dot) => {
            if (dot) dot.dataset.live = "true";
          });
          return;
        }

        section.dataset.mode = "pinned";

        // Play one card's signature visualization from zero up to its finished
        // state. Always a fromTo, so it replays cleanly when scrolling back.
        const playSignature = (card: HTMLElement, kind: CapabilityKind) => {
          if (kind === "frames") {
            gsap.fromTo(
              card.querySelectorAll("[data-frame]"),
              { autoAlpha: 0, y: 10 },
              { autoAlpha: 1, y: 0, duration: 0.34, stagger: 0.05, ease: "power2.out", overwrite: true },
            );
          } else if (kind === "curve") {
            const trace = card.querySelector<SVGPathElement>("[data-trace]");
            if (trace) {
              const len = trace.getTotalLength();
              gsap.fromTo(
                trace,
                { strokeDasharray: len, strokeDashoffset: len },
                { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut", overwrite: true },
              );
            }
            gsap.fromTo(
              card.querySelectorAll("[data-node]"),
              { scale: 0, transformOrigin: "center" },
              { scale: 1, duration: 0.3, stagger: 0.09, delay: 0.18, ease: "back.out(2)", overwrite: true },
            );
          } else if (kind === "export") {
            card.querySelectorAll<HTMLElement>("[data-fill]").forEach((fill, i) => {
              const target = parseFloat(fill.style.getPropertyValue("--mc-fill")) || 1;
              gsap.fromTo(
                fill,
                { scaleX: 0 },
                { scaleX: target, duration: 0.5, delay: i * 0.1, ease: "power2.out", overwrite: true },
              );
            });
          } else if (kind === "score") {
            const ring = card.querySelector<SVGCircleElement>("[data-gauge-ring]");
            const number = card.querySelector<HTMLElement>("[data-gauge-number]");
            if (ring) {
              gsap.fromTo(
                ring,
                { strokeDashoffset: GAUGE_CIRC },
                {
                  strokeDashoffset: GAUGE_CIRC * (1 - SCORE_TARGET / 100),
                  duration: 0.9,
                  ease: "power2.out",
                  overwrite: true,
                },
              );
            }
            if (number) {
              const counter = { value: 0 };
              gsap.to(counter, {
                value: SCORE_TARGET,
                duration: 0.9,
                ease: "power2.out",
                overwrite: true,
                onUpdate: () => {
                  number.textContent = String(Math.round(counter.value));
                },
              });
            }
          }
          // a11y: switch + checks are driven by the CSS [data-active] state.
        };

        let lastIndex = -1;
        const setActive = (index: number) => {
          if (index === lastIndex) return;
          lastIndex = index;
          cards.forEach((card, i) => {
            card.dataset.active = i === index ? "true" : "false";
          });
          ticksRef.current.forEach((tick, i) => {
            if (tick) tick.dataset.live = i === index ? "true" : "false";
          });
          dotsRef.current.forEach((dot, i) => {
            if (dot) dot.dataset.live = i === index ? "true" : "false";
          });
          if (stepReadoutRef.current) {
            stepReadoutRef.current.textContent = `${pad(index + 1)} / ${pad(n)}`;
          }
          const active = cards[index];
          if (active) playSignature(active, CAPABILITIES[index].kind);
        };

        // Geometry: place card `index` centered under the read-head. Spacing is
        // uniform, so position is linear in the (fractional) active index.
        let cardW = 0;
        let firstLeft = 0;
        let step = 0;
        let center = 0;
        const measure = () => {
          cardW = cards[0]?.offsetWidth ?? 0;
          firstLeft = cards[0]?.offsetLeft ?? 0;
          step = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : 0;
          center = viewport.clientWidth / 2;
        };
        const place = (progress: number) => {
          const activeFloat = progress * lastFeatureIndex;
          const x = center - (firstLeft + activeFloat * step + cardW / 2);
          gsap.set(track, { x });
        };

        measure();
        place(0);

        const proxy = { progress: 0 };
        const tween = gsap.to(proxy, {
          progress: 1,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${lastFeatureIndex * window.innerHeight}`,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
            scrub: 0.5,
            invalidateOnRefresh: true,
            onRefresh: () => {
              measure();
              place(proxy.progress);
            },
          },
          onUpdate: () => {
            const p = proxy.progress;
            place(p);
            section.style.setProperty("--mc-progress", `${(p * 100).toFixed(2)}%`);
            if (frameReadoutRef.current) {
              frameReadoutRef.current.textContent = `${Math.round(p * 640)}ms`;
            }
            setActive(Math.round(p * lastFeatureIndex));
          },
        });

        setActive(0);
        ScrollTrigger.refresh();

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          gsap.set(track, { clearProps: "transform" });
        };
      },
      section,
    );

    return () => mm.revert();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="capabilities-heading"
    >
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.kicker}>One analysis</span>
            <h2 id="capabilities-heading" className={styles.title}>
              Everything one clip becomes, <em>start to ship</em>.
            </h2>
          </div>
          <dl className={styles.readout} aria-hidden="true">
            <dt>frame</dt>
            <dd>
              <b ref={frameReadoutRef}>0ms</b>
            </dd>
            <dt>step</dt>
            <dd ref={stepReadoutRef}>01 / 05</dd>
            <dt>state</dt>
            <dd>reading</dd>
          </dl>
        </header>

        <div className={styles.ruler} aria-hidden="true">
          <span className={styles.rulerFill} />
          {TICKS.map((ms, i) => (
            <span
              key={ms}
              className={styles.tick}
              data-live={i === 0 ? "true" : "false"}
              ref={(el) => {
                ticksRef.current[i] = el;
              }}
            >
              {ms}ms
            </span>
          ))}
        </div>

        <div className={styles.viewport} ref={viewportRef}>
          <div className={styles.readhead} aria-hidden="true" />
          <div className={styles.track} ref={trackRef}>
            {CAPABILITIES.map((cap, i) => (
              <article
                key={cap.id}
                className={styles.card}
                data-active={i === 0 ? "true" : "false"}
                data-testid="capability-card"
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
              >
                <div className={styles.cardHead}>
                  <span className={styles.cardFrame}>{cap.frame}</span>
                  <span className={styles.cardStep}>
                    {pad(i + 1)}/{pad(CAPABILITIES.length)}
                  </span>
                </div>
                <h3 className={styles.cardTitle}>
                  <DecryptedText
                    text={cap.title}
                    animateOn="view"
                    sequential
                    speed={26}
                    maxIterations={16}
                    revealDirection="start"
                    encryptedClassName="mc-enc"
                  />
                </h3>
                <p className={styles.cardBody}>{cap.body}</p>
                <Signature kind={cap.kind} />
              </article>
            ))}
          </div>
        </div>

        <div className={styles.dots} aria-hidden="true">
          {CAPABILITIES.map((cap, i) => (
            <span
              key={cap.id}
              className={styles.dot}
              data-live={i === 0 ? "true" : "false"}
              ref={(el) => {
                dotsRef.current[i] = el;
              }}
            />
          ))}
          <span className={styles.hint} style={{ marginLeft: 16 }}>
            scroll to scrub
          </span>
        </div>
      </div>
    </section>
  );
}
