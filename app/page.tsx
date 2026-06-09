"use client";

/* eslint-disable @next/next/no-img-element -- Partner logos are tiny external Simple Icons SVG marks, not LCP content. */
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const GLITCH_CHARS = "!<>-_\\/[]{}—=+*^?#________";
const scrambleText = (element: HTMLElement | null, finalString: string, goingOut: boolean = false) => {
  if (!element) return;
  let iteration = 0;
  const intervalId = element.getAttribute('data-interval-id');
  if (intervalId) clearInterval(parseInt(intervalId));

  const stepTime = 20;
  const totalSteps = 12;
  const charsPerStep = Math.max(1, finalString.length / totalSteps);

  const interval = setInterval(() => {
    element.innerText = finalString
      .split("")
      .map((letter, index) => {
        if (!goingOut) {
          if (index < iteration) return finalString[index];
          return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
        } else {
          if (index < iteration) return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
          return finalString[index];
        }
      })
      .join("");

    if(iteration >= finalString.length) {
      clearInterval(interval);
      element.removeAttribute('data-interval-id');
      if (!goingOut) {
        element.innerText = finalString;
      }
    }

    iteration += charsPerStep;
  }, stepTime);

  element.setAttribute('data-interval-id', interval.toString());
};

const FEATURES_DATA = [
  { num: "01", title: "Upload Any Format", desc: "Drag in MP4, GIF, WebM, or Lottie files. Our engine handles any animation source with frame-perfect accuracy.", code: "// 8 frames extracted\n> format: MP4 → JPEG\n> resolution: 1920×1080" },
  { num: "02", title: "AI Frame Analysis", desc: "Neural networks decompose motion into discrete keyframes, easing curves, and transform paths — automatically.", code: "// motion analyzed\n> keyframes: 12\n> easing: cubic-bezier(...)" },
  { num: "03", title: "Multi-Framework Output", desc: "Get production-ready CSS, GSAP, and Framer Motion code. Copy, paste, ship.", code: "// output ready\n> CSS  ✓\n> GSAP  ✓\n> Framer ✓" },
  { num: "04", title: "Performance Scorer", desc: "Every generated animation is benchmarked for jank, repaints, and composite layer usage with a 0-100 score.", code: "// perf score\n> GPU layers: yes\n> score: 94/100" },
  { num: "05", title: "Accessibility Audit", desc: "Automatic prefers-reduced-motion fallbacks and WCAG compliance checks on every export.", code: "// a11y check\n> reduced-motion: ✓\n> WCAG AA: pass" }
];

const FRAME_SAMPLES = ["00", "04", "08", "12", "16", "20", "24", "28"];
const CURVE_POINTS = [
  { left: "8%", top: "72%" },
  { left: "27%", top: "34%" },
  { left: "49%", top: "44%" },
  { left: "71%", top: "18%" },
  { left: "91%", top: "42%" },
];
const EXPORT_STACK = [
  { label: "CSS", value: "ready", width: "84%" },
  { label: "GSAP", value: "spring", width: "72%" },
  { label: "Framer", value: "mapped", width: "91%" },
];

const LOGO_BRANDS = [
  { name: "Vercel", icon: "vercel" },
  { name: "Razorpay", icon: "razorpay" },
  { name: "Linear", icon: "linear" },
  { name: "Figma", icon: "figma" },
  { name: "Notion", icon: "notion" },
  { name: "Loom", icon: "loom" },
  { name: "Raycast", icon: "raycast" },
  { name: "Resend", icon: "resend" },
];

const PRICING_TIERS = [
  {
    id: "preview",
    name: "Preview",
    price: "$0",
    period: "during beta",
    description: "Explore the converter, inspect generated snippets, and validate short UI motion references.",
    features: ["10 analyses per month", "CSS and GSAP draft output", "Community support"],
    cta: "Start preview",
    href: "/app",
  },
  {
    id: "pro",
    name: "Pro",
    price: "Early",
    period: "access",
    description: "For beta users who want priority access when Pro opens.",
    features: ["Priority beta queue", "Gemini-only analysis during beta", "CSS, GSAP, and Framer Motion bundles", "Launch offer lock-in"],
    cta: "Join Pro early access",
    href: "/pricing",
    featured: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: "Early",
    period: "access",
    description: "For teams that want first access to Studio workflows.",
    features: ["Shared team interest list", "Private motion library preview", "Design token mapping discovery", "Concierge onboarding when Studio opens"],
    cta: "Join Studio early access",
    href: "/pricing",
  },
];

const INLINE_BADGE_TONES = {
  capture: "216, 207, 188",
  analyze: "0, 255, 136",
  output: "181, 255, 217",
  quiet: "131, 154, 139",
} as const;

type InlineBadgeTone = keyof typeof INLINE_BADGE_TONES;

function InlineMotionBadge({
  children,
  tone = "capture",
  variant = "default",
  delay = "0s",
}: {
  children: React.ReactNode;
  tone?: InlineBadgeTone;
  variant?: "default" | "dot";
  delay?: string;
}) {
  return (
    <span
      className="motioncode-inline-badge"
      data-variant={variant}
      style={
        {
          "--motioncode-badge-rgb": INLINE_BADGE_TONES[tone],
          "--motioncode-badge-delay": delay,
        } as React.CSSProperties
      }
    >
      {variant === "dot" ? (
        <span className="motioncode-inline-badge-dot" aria-hidden="true" />
      ) : null}
      <span className="motioncode-inline-badge-label">{children}</span>
    </span>
  );
}

export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const heroEyebrowRef = useRef<HTMLDivElement>(null);
  const heroLinesRef = useRef<(HTMLDivElement | null)[]>([]);
  const heroSubtextRef = useRef<HTMLParagraphElement>(null);
  const heroTerminalRef = useRef<HTMLDivElement>(null);
  const heroVisualStageRef = useRef<HTMLDivElement>(null);
  const heroTermLinesRef = useRef<(HTMLDivElement | null)[]>([]);
  const heroGlowRef = useRef<HTMLDivElement>(null);

  const featuresSectionRef = useRef<HTMLDivElement>(null);
  const leftCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rightPanelsRef = useRef<(HTMLDivElement | null)[]>([]);

  const processSectionRef = useRef<HTMLDivElement>(null);
  const processStepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (heroGlowRef.current) {
        heroGlowRef.current.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
      }
      if (navRef.current) {
        const bounds = navRef.current.getBoundingClientRect();
        const x = ((e.clientX - bounds.left) / bounds.width) * 100;
        const y = ((e.clientY - bounds.top) / bounds.height) * 100;
        navRef.current.style.setProperty("--glass-x", `${x.toFixed(2)}%`);
        navRef.current.style.setProperty("--glass-y", `${y.toFixed(2)}%`);
      }
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, []);

  useEffect(() => {
    let rafId = 0;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);

    const updateNavShape = () => {
      const nav = navRef.current;
      if (!nav) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (viewportWidth < 768) {
        nav.style.setProperty("--motioncode-nav-width", "calc(100vw - 28px)");
        nav.style.setProperty("--motioncode-nav-height", "58px");
        nav.style.setProperty("--motioncode-nav-density", "0");
        return;
      }

      const expandedWidth = Math.min(940, viewportWidth - 64);
      const compactWidth = Math.max(720, expandedWidth - 188);
      const heroProgress = clamp(window.scrollY / (viewportHeight * 0.76), 0, 1);

      const sectionExpansion = ["features", "how-it-works", "pricing"].reduce(
        (strongest, sectionId) => {
          const section = document.getElementById(sectionId);
          if (!section) return strongest;

          const rect = section.getBoundingClientRect();
          const sectionCenter = rect.top + rect.height / 2;
          const distanceFromViewportCenter = Math.abs(
            sectionCenter - viewportHeight / 2,
          );
          const closeness = clamp(
            1 - distanceFromViewportCenter / (viewportHeight * 0.68),
            0,
            1,
          );

          return Math.max(strongest, closeness);
        },
        0,
      );

      const compactedWidth =
        expandedWidth - (expandedWidth - compactWidth) * heroProgress;
      const width = Math.min(
        expandedWidth,
        compactedWidth + sectionExpansion * 72,
      );
      const height = 56 - heroProgress * 7 + sectionExpansion * 3;
      const density = clamp(heroProgress - sectionExpansion * 0.35, 0, 1);

      nav.style.setProperty("--motioncode-nav-width", `${Math.round(width)}px`);
      nav.style.setProperty(
        "--motioncode-nav-height",
        `${Math.round(height)}px`,
      );
      nav.style.setProperty("--motioncode-nav-density", density.toFixed(3));
    };

    const requestNavShapeUpdate = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateNavShape);
    };

    updateNavShape();
    window.addEventListener("scroll", requestNavShapeUpdate, { passive: true });
    window.addEventListener("resize", requestNavShapeUpdate);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", requestNavShapeUpdate);
      window.removeEventListener("resize", requestNavShapeUpdate);
    };
  }, []);

  const handleMotionLabPointer = (event: React.MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    event.currentTarget.style.setProperty("--cursor-x", `${x.toFixed(2)}%`);
    event.currentTarget.style.setProperty("--cursor-y", `${y.toFixed(2)}%`);
  };

  const setMotionLabHover = (
    event: React.MouseEvent<HTMLDivElement>,
    hovered: boolean,
  ) => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    event.currentTarget.setAttribute("data-hovered", hovered ? "true" : "false");
    event.currentTarget.style.borderColor = hovered
      ? "rgba(216, 207, 188, 0.42)"
      : "rgba(216, 207, 188, 0.18)";
    event.currentTarget.style.transform =
      hovered && !prefersReducedMotion
        ? "translateY(-50%) scale(1.018)"
        : "translateY(-50%)";
  };

  const setInteractiveHover = (
    event: React.MouseEvent<HTMLElement>,
    hovered: boolean,
  ) => {
    event.currentTarget.setAttribute("data-hovered", hovered ? "true" : "false");
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Setup Hero Animation
      gsap.fromTo(
        heroLinesRef.current,
        { y: "100%", opacity: 0 },
        { y: "0%", opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" }
      );

      gsap.fromTo(
        heroSubtextRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1, delay: 0.6, ease: "power2.out" }
      );

      const terminalLines = heroTermLinesRef.current.filter(Boolean);
      gsap.set(terminalLines, { autoAlpha: 1, y: 0 });

      gsap.fromTo(
        ".motioncode-hero-field-line, .motioncode-hero-field-tick",
        { opacity: 0, scaleX: 0.45, transformOrigin: "left center" },
        {
          opacity: 1,
          scaleX: 1,
          duration: 1.2,
          stagger: 0.14,
          delay: 0.35,
          ease: "power2.out",
        },
      );

      gsap.to(".motioncode-hero-field-line-b", {
        x: "-8%",
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      if (heroSectionRef.current) {
        const heroChromeTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.75,
          },
        });

        if (navRef.current) {
          heroChromeTimeline.to(
            navRef.current,
            {
              y: -6,
              ease: "none",
            },
            0
          );
        }

        if (heroEyebrowRef.current) {
          heroChromeTimeline.to(
            heroEyebrowRef.current,
            {
              y: -18,
              opacity: 0.74,
              ease: "none",
            },
            0
          );
        }

        if (heroVisualStageRef.current) {
          heroChromeTimeline.to(
            heroVisualStageRef.current,
            {
              y: -26,
              rotateX: 2,
              scale: 0.985,
              opacity: 0.86,
              ease: "none",
            },
            0
          );
        }
      }

      // Setup Features Section ScrollTrigger
      const NUM_FEATURES = FEATURES_DATA.length;
      let lastIndex = -1;
      let featureTrigger: ReturnType<typeof ScrollTrigger.create> | null = null;
      const compactFeaturesQuery = window.matchMedia("(max-width: 767px)");

      const activateFeature = (index: number) => {
        const changed = lastIndex !== index;
        leftCardsRef.current.forEach((card, i) => {
          if (!card) return;
          card.dataset.active = i === index ? "true" : "false";
          card.style.opacity = i === index ? "1" : "0.62";
          card.style.borderColor = i === index ? "var(--accent)" : "var(--border)";
          card.style.borderLeft = i === index ? "3px solid #00ff88" : "1px solid var(--border)";
          card.style.background = i === index ? "rgba(216, 207, 188, 0.16)" : "rgba(18, 20, 15, 0.72)";
          const numEl = card.querySelector('.card-num') as HTMLElement;
          if (numEl) {
            numEl.style.textShadow = i === index ? "0 0 12px #00ff8860" : "none";
          }
        });
        rightPanelsRef.current.forEach((panel, i) => {
          if (!panel) return;
          panel.dataset.active = i === index ? "true" : "false";
          if (i === index) {
            panel.style.opacity = "1";
            panel.style.transform = "scale(1)";
            panel.style.filter = "blur(0px)";

            if (changed) {
              const titleEl = panel.querySelector('.feature-title') as HTMLElement;
              const descEl = panel.querySelector('.feature-desc') as HTMLElement;
              const codeEl = panel.querySelector('.feature-code-snippet') as HTMLElement;
              if (titleEl) scrambleText(titleEl, FEATURES_DATA[i].title, false);
              if (descEl) scrambleText(descEl, FEATURES_DATA[i].desc, false);
              if (codeEl) {
                gsap.fromTo(
                  codeEl,
                  { opacity: 0.3, y: 18, filter: "blur(4px)" },
                  { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.46, ease: "power2.out" }
                );
              }
            }
          } else {
            panel.style.opacity = "0";
            panel.style.transform = "scale(1.05)";
            panel.style.filter = "blur(8px)";
            if (changed && i === lastIndex) {
              const titleEl = panel.querySelector('.feature-title') as HTMLElement;
              const descEl = panel.querySelector('.feature-desc') as HTMLElement;
              if (titleEl) scrambleText(titleEl, FEATURES_DATA[i].title, true);
              if (descEl) scrambleText(descEl, FEATURES_DATA[i].desc, true);
            }
          }
        });
        lastIndex = index;
      };

      const resetFeatureCards = () => {
        leftCardsRef.current.forEach((card) => {
          if (!card) return;
          card.dataset.active = "false";
          card.style.opacity = "1";
          card.style.borderColor = "var(--border)";
          card.style.borderLeft = "1px solid var(--border)";
          card.style.background = "rgba(18, 20, 15, 0.72)";
          const numEl = card.querySelector('.card-num') as HTMLElement;
          if (numEl) {
            numEl.style.textShadow = "none";
          }
        });
        rightPanelsRef.current.forEach((panel) => {
          if (!panel) return;
          panel.dataset.active = "false";
          panel.style.opacity = "";
          panel.style.transform = "";
          panel.style.filter = "";
        });
      };

      const clearFeatureTrigger = () => {
        if (!featureTrigger) return;
        featureTrigger.kill();
        featureTrigger = null;
      };

      const applyFeatureLayout = () => {
        clearFeatureTrigger();
        lastIndex = -1;

        if (!featuresSectionRef.current) return;

        if (compactFeaturesQuery.matches) {
          resetFeatureCards();
          ScrollTrigger.refresh();
          return;
        }

        featureTrigger = ScrollTrigger.create({
          trigger: featuresSectionRef.current,
          start: "top top",
          end: () => `+=${NUM_FEATURES * window.innerHeight}`,
          pin: true,
          pinSpacing: false,
          anticipatePin: 1,
          onUpdate: (self) => {
            const index = Math.min(
              Math.floor(self.progress * NUM_FEATURES + 0.35),
              NUM_FEATURES - 1
            );
            activateFeature(index);
          }
        });

        activateFeature(0);
        ScrollTrigger.refresh();
      };

      applyFeatureLayout();
      compactFeaturesQuery.addEventListener("change", applyFeatureLayout);

      // Setup Process Steps Animation
      if (processSectionRef.current && processStepsRef.current.length > 0) {
        gsap.fromTo(
          processStepsRef.current,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power2.out",
            scrollTrigger: {
              trigger: processSectionRef.current,
              start: "top 70%",
            }
          }
        );
      }

      return () => {
        compactFeaturesQuery.removeEventListener("change", applyFeatureLayout);
        clearFeatureTrigger();
      };
    });

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div className="motioncode-march-shell bg-[var(--bg)] text-[var(--text)] min-h-screen relative">
      <div ref={heroGlowRef}
           data-testid="hero-mouse-glow"
           style={{
             position: "fixed", width: "420px", height: "420px",
             background: "radial-gradient(circle, rgba(0,255,136,0.075) 0%, transparent 68%)",
             borderRadius: "50%", pointerEvents: "none", zIndex: 2,
             left: 0, top: 0,
             transform: "translate(-50%, -50%)",
             transition: "transform 0.1s ease-out",
             willChange: "transform"
           }} />

      {/* SECTION 1 - NAVBAR */}
      <nav
        ref={navRef}
        aria-label="Primary"
        className="motioncode-march-nav motioncode-glass-nav fixed left-0 right-0 z-50 rounded-full backdrop-blur-2xl"
        style={{
          pointerEvents: "none",
          willChange: "transform",
        }}
      >
        <div className="motioncode-nav-shell">
          <Link href="/" className="motioncode-nav-brand">
            <span className="motioncode-nav-brand-text">MotionCode</span>
          </Link>

          <div className="motioncode-nav-menu" aria-label="Landing sections">
            <Link href="#features" className="motioncode-nav-link">
              Features
            </Link>
            <Link href="#how-it-works" className="motioncode-nav-link">
              How it Works
            </Link>
            <Link href="#pricing" className="motioncode-nav-link">
              Pricing
            </Link>
          </div>

          <Link href="/app" className="motioncode-nav-cta">
            Try Free
          </Link>
        </div>
      </nav>

      {/* SECTION 2 - HERO */}
      <section ref={heroSectionRef}
               className="motioncode-hero-section relative w-full overflow-hidden"
               style={{
                 minHeight: "100dvh",
                 borderBottom: "1px solid var(--border)"
               }}>

        <div style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", writingMode: "vertical-rl", textOrientation: "mixed", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#1a1a1a", letterSpacing: "3px" }}>
          01 /
        </div>

        {/* Scan line */}
        <div style={{
          position: "absolute", width: "100%", height: "1px", left: 0,
          background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.18), transparent)",
          animation: "scan 6s ease-in-out infinite",
          pointerEvents: "none", zIndex: 1
        }} />

        <div className="motioncode-hero-field" aria-hidden="true">
          <span className="motioncode-hero-field-line motioncode-hero-field-line-a" />
          <span className="motioncode-hero-field-line motioncode-hero-field-line-b" />
          <span className="motioncode-hero-field-tick motioncode-hero-field-tick-a" />
          <span className="motioncode-hero-field-tick motioncode-hero-field-tick-b" />
          <span className="motioncode-hero-field-tick motioncode-hero-field-tick-c" />
        </div>

        <div className="motioncode-hero-microcopy motioncode-hero-microcopy-top" aria-hidden="true">
          <span>capture grid</span>
          <strong>08 frames</strong>
        </div>
        <div className="motioncode-hero-microcopy motioncode-hero-microcopy-bottom" aria-hidden="true">
          <span>render path</span>
          <strong>composite only</strong>
        </div>

        <div
          ref={heroEyebrowRef}
          data-testid="hero-eyebrow"
          className="hero-eyebrow hero-signal-chip flex items-center"
          style={{
            position: "absolute",
            top: "16.5vh",
            left: "10vw",
            zIndex: 10,
            gap: "10px",
            minHeight: "36px",
            willChange: "transform, opacity",
          }}
        >
          <span
            className="hero-signal-dot"
            aria-hidden="true"
            style={{
              width: "7px",
              height: "7px",
              backgroundColor: "#00ff88",
              borderRadius: "50%",
              display: "inline-block",
              boxShadow: "0 0 16px rgba(0, 255, 136, 0.72)",
              animation: "heroPulse 2s ease infinite",
            }}
          />
          <span
            className="hero-signal-text"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "#FFFBF4",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {"motion intelligence platform"}
          </span>
          <span
            className="hero-signal-meter"
            aria-hidden="true"
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              width: "42px",
              height: "6px",
              overflow: "hidden",
              borderRadius: "999px",
              background: "rgba(216, 207, 188, 0.12)",
            }}
          >
            <span
              style={{
                display: "block",
                width: "68%",
                height: "100%",
                borderRadius: "inherit",
                background: "linear-gradient(90deg, rgba(0, 255, 136, 0.35), #00ff88)",
              }}
            />
          </span>
        </div>

        <div className="motioncode-hero-headline flex flex-col relative z-10" style={{ pointerEvents: "none" }}>
          <div className="motioncode-hero-line-mask">
            <div ref={el => { heroLinesRef.current[0] = el; }} style={{ pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: "clamp(52px, 6.5vw, 112px)", fontWeight: "bold", color: "var(--text)", lineHeight: 1.02, willChange: "transform" }}>
              Turn any animation
            </div>
          </div>
          <div className="motioncode-hero-line-mask">
            <div ref={el => { heroLinesRef.current[1] = el; }} style={{ pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: "clamp(52px, 6.5vw, 112px)", fontWeight: "bold", color: "var(--text)", lineHeight: 1.02, willChange: "transform" }}>
              into production
            </div>
          </div>
          <div className="motioncode-hero-line-mask">
            <div ref={el => { heroLinesRef.current[2] = el; }} style={{ pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: "clamp(52px, 6.5vw, 112px)", fontWeight: "bold", color: "var(--accent)", lineHeight: 1.02, willChange: "transform" }}>
              code.
            </div>
          </div>
        </div>

        <p ref={heroSubtextRef}
           className="motioncode-hero-subtext relative z-10 pointer-events-none"
           style={{
             fontFamily: "var(--font-body)",
             fontSize: "15px",
             color: "var(--muted)",
             lineHeight: 1.7,
             marginTop: "28px",
             maxWidth: "420px"
           }}>
          Upload a video. Get CSS, GSAP, and Framer Motion code instantly.
        </p>

        <p className="motioncode-badge-copy motioncode-hero-badges relative z-10 pointer-events-none">
          Move from <InlineMotionBadge tone="capture">frame capture</InlineMotionBadge>{" "}
          to <InlineMotionBadge tone="analyze" delay="0.35s">curve mapping</InlineMotionBadge>, then
          export <InlineMotionBadge tone="output" delay="0.7s">ship-ready code</InlineMotionBadge>{" "}
          with <InlineMotionBadge tone="quiet" variant="dot">reduced-motion checks</InlineMotionBadge>.
        </p>

        <div className="motioncode-hero-actions flex flex-row gap-4 relative z-10" style={{ marginTop: "40px" }}>
          <Link href="/app"
                className="motioncode-hero-action motioncode-hero-action-primary"
                style={{
                  background: "var(--accent)",
                  color: "var(--bg)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  fontWeight: "bold",
                  padding: "14px 32px",
                  border: "none",
                  borderRadius: "0",
                  textDecoration: "none",
                  transition: "background 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
          >
            Start for free →
          </Link>
          <Link href="#features"
                className="motioncode-hero-action motioncode-hero-action-secondary"
                style={{
                  background: "transparent",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  padding: "14px 32px",
                  border: "1px solid var(--border)",
                  borderRadius: "0",
                  textDecoration: "none",
                  transition: "border-color 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--accent-border)"}
                onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border)"}
          >
            See it work ↓
          </Link>
        </div>

        <div
          ref={heroTerminalRef}
          data-testid="motion-lab-preview"
          data-hovered="false"
          className="motion-lab-preview hidden xl:block"
          onMouseEnter={(event) => setMotionLabHover(event, true)}
          onMouseMove={handleMotionLabPointer}
          onMouseLeave={(event) => setMotionLabHover(event, false)}
        >
          <div
            ref={heroVisualStageRef}
            className="motion-lab-stage"
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              willChange: "transform, opacity",
            }}
          >
            <div
              className="motion-lab-halo motion-lab-halo-primary"
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: "42px 38px auto auto",
                width: "220px",
                height: "220px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(0, 255, 136, 0.16), transparent 66%)",
                filter: "blur(4px)",
                opacity: 0.72,
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <div
              className="motion-lab-halo motion-lab-halo-secondary"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-42px",
                bottom: "74px",
                width: "190px",
                height: "190px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(216, 207, 188, 0.14), transparent 68%)",
                filter: "blur(7px)",
                opacity: 0.56,
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
            <div
              className="motion-lab-orbit motion-lab-orbit-inner"
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "56px",
                top: "138px",
                width: "124px",
                height: "124px",
                border: "1px solid rgba(216, 207, 188, 0.16)",
                borderRadius: "50%",
                opacity: 0.7,
                pointerEvents: "none",
                zIndex: 2,
              }}
            >
              <span />
            </div>
            <div
              className="motion-lab-orbit motion-lab-orbit-outer"
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "18px",
                top: "98px",
                width: "204px",
                height: "204px",
                border: "1px solid rgba(0, 255, 136, 0.1)",
                borderRadius: "50%",
                opacity: 0.64,
                pointerEvents: "none",
                zIndex: 2,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  right: "26px",
                  top: "22px",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#00ff88",
                  boxShadow: "0 0 18px rgba(0, 255, 136, 0.7)",
                }}
              />
            </div>
            <div
              className="motion-lab-depth-card motion-lab-depth-card-intent"
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "70px",
                top: "268px",
                display: "grid",
                gap: "2px",
                minWidth: "104px",
                padding: "10px 12px",
                border: "1px solid rgba(216, 207, 188, 0.15)",
                borderRadius: "8px",
                background: "rgba(8, 10, 9, 0.68)",
                boxShadow: "0 16px 36px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 251, 244, 0.08)",
                backdropFilter: "blur(14px)",
                fontFamily: "var(--font-mono)",
                zIndex: 4,
              }}
            >
              <span>intent</span>
              <strong>94%</strong>
            </div>
            <div
              className="motion-lab-depth-card motion-lab-depth-card-energy"
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "48px",
                bottom: "82px",
                display: "grid",
                gap: "2px",
                minWidth: "112px",
                padding: "10px 12px",
                border: "1px solid rgba(216, 207, 188, 0.13)",
                borderRadius: "8px",
                background: "rgba(11, 13, 10, 0.72)",
                boxShadow: "0 18px 40px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 251, 244, 0.07)",
                backdropFilter: "blur(14px)",
                fontFamily: "var(--font-mono)",
                zIndex: 4,
              }}
            >
              <span>ease map</span>
              <strong>clean</strong>
            </div>
            <div
              className="motion-lab-proof-chip motion-lab-proof-chip-latency"
              aria-hidden="true"
              style={{
                position: "absolute",
                right: "30px",
                bottom: "114px",
                display: "flex",
                alignItems: "center",
                gap: "9px",
                padding: "9px 12px",
                border: "1px solid rgba(0, 255, 136, 0.18)",
                borderRadius: "999px",
                background: "rgba(0, 255, 136, 0.08)",
                color: "#FFFBF4",
                boxShadow: "0 14px 34px rgba(0, 0, 0, 0.3)",
                backdropFilter: "blur(12px)",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                zIndex: 5,
              }}
            >
              <span>render safe</span>
              <strong>0 repaint</strong>
            </div>

            <div className="motion-lab-rail motion-lab-rail-top">
              <span />
              <span />
            </div>
            <div className="motion-lab-rail motion-lab-rail-bottom">
              <span />
              <span />
            </div>

            <div className="motion-lab-console">
              <div className="motion-lab-window-bar">
                <span className="motion-lab-dot motion-lab-dot-red" />
                <span className="motion-lab-dot motion-lab-dot-yellow" />
                <span className="motion-lab-dot motion-lab-dot-green" />
                <span className="motion-lab-window-title">analysis kernel</span>
              </div>
              <div className="motion-lab-code">
                <div ref={el => { heroTermLinesRef.current[0] = el; }} className="motion-lab-line motion-lab-line-muted">$ motioncode analyze button-morph.mp4</div>
                <div ref={el => { heroTermLinesRef.current[1] = el; }} className="motion-lab-line motion-lab-line-muted">&gt; extracting 8 frames...</div>
                <div ref={el => { heroTermLinesRef.current[2] = el; }} className="motion-lab-line motion-lab-line-accent">&gt; intent detected: morph ✓</div>
                <div ref={el => { heroTermLinesRef.current[3] = el; }} className="motion-lab-line motion-lab-line-accent">&gt; duration: 340ms</div>
                <div ref={el => { heroTermLinesRef.current[4] = el; }} className="motion-lab-line motion-lab-line-muted">&gt; generating output...</div>
                <div ref={el => { heroTermLinesRef.current[5] = el; }} className="motion-lab-line motion-lab-line-accent">
                  &gt; CSS  GSAP  Framer Motion  ✓ <span className="blink-cursor">▊</span>
                </div>
              </div>
            </div>

            <div className="motion-lab-panel motion-lab-panel-sampler" data-testid="motion-lab-sampler">
              <div className="motion-lab-panel-label">frame sampler</div>
              <div className="motion-frame-grid" aria-hidden="true">
                {FRAME_SAMPLES.map((sample, index) => (
                  <span
                    key={sample}
                    className="motion-frame-tile"
                    style={{ animationDelay: `${index * 90}ms` }}
                  >
                    {sample}
                  </span>
                ))}
              </div>
              <div className="motion-lab-mini-caption">8 keyframes locked</div>
            </div>

            <div className="motion-lab-panel motion-lab-panel-curve" data-testid="motion-lab-curve">
              <div className="motion-lab-panel-label">curve solver</div>
              <div className="motion-curve-field" aria-hidden="true">
                <span className="motion-curve-path" />
                {CURVE_POINTS.map((point, index) => (
                  <span
                    key={`${point.left}-${point.top}`}
                    className="motion-curve-node"
                    style={{
                      left: point.left,
                      top: point.top,
                      animationDelay: `${index * 120}ms`,
                    }}
                  />
                ))}
              </div>
              <div className="motion-lab-vector-row">
                <span>morph vector</span>
                <strong>0.84</strong>
              </div>
            </div>

            <div className="motion-lab-panel motion-lab-panel-export" data-testid="motion-lab-export">
              <div className="motion-lab-panel-label">export stack</div>
              <div className="motion-export-stack">
                {EXPORT_STACK.map((item, index) => (
                  <div key={item.label} className="motion-export-row">
                    <div>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <span className="motion-export-track">
                      <span
                        className="motion-export-fill"
                        style={{
                          width: item.width,
                          animationDelay: `${index * 130}ms`,
                        }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="motion-lab-status-strip">
              <span>composite-only transforms</span>
              <span>340ms</span>
              <span>reduced motion fallback</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - LOGO STRIP */}
      <section data-testid="logo-strip" className="motioncode-logo-strip" style={{ padding: "40px 0", borderBottom: "1px solid var(--border)", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "3px", whiteSpace: "nowrap", marginBottom: "32px", opacity: 0.6 }}>
          TRUSTED BY DEVELOPERS AT
        </div>
        <div className="flex whitespace-nowrap marquee-scroll w-full">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="motioncode-logo-track flex" style={{ gap: "72px", paddingRight: "72px" }}>
              {LOGO_BRANDS.map(brand => (
                <span key={`${i}-${brand.name}`} className="motioncode-logo-mark">
                  <img
                    src={`https://cdn.simpleicons.org/${brand.icon}/D8CFBC`}
                    alt={`${brand.name} logo`}
                    className="motioncode-logo-img"
                    loading="lazy"
                  />
                  <span>{brand.name}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 - LOGO/FEATURES (STICKY SCROLL) */}
      <section id="features" ref={featuresSectionRef} className="motioncode-feature-section"
               style={{ position: "relative", height: "100vh", overflow: "hidden", display: "flex", borderBottom: "1px solid var(--border)", marginBottom: `${(FEATURES_DATA.length - 1) * 100}vh` }}>

        <div style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", writingMode: "vertical-rl", textOrientation: "mixed", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#1a1a1a", letterSpacing: "3px" }}>
          02 /
        </div>

        <div className="motioncode-feature-list" style={{ width: "48%", padding: "60px 40px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#3a3a4a", letterSpacing: "3px" }}>PRODUCT</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "28px", color: "var(--text)", marginBottom: "18px", marginTop: "16px" }}>Everything you need to ship motion.</div>
          <div className="motioncode-feature-status-line">
            <InlineMotionBadge tone="capture" delay="0.15s">source locked</InlineMotionBadge>
            <InlineMotionBadge tone="analyze" delay="0.45s">motion read</InlineMotionBadge>
            <InlineMotionBadge tone="quiet" variant="dot">review pulse</InlineMotionBadge>
          </div>

          <div className="motioncode-feature-list-inner" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {FEATURES_DATA.map((ft, i) => (
            <div key={ft.num}
                 ref={el => { leftCardsRef.current[i] = el; }}
                 data-testid="feature-card"
                 data-active={i === 0 ? "true" : "false"}
                 className="motioncode-feature-card"
                 style={{
                   padding: "24px 28px",
                   border: "1px solid var(--border)",
                   borderLeft: i === 0 ? "3px solid #00ff88" : "1px solid var(--border)",
                   marginBottom: "10px",
                   borderRadius: "10px",
                   transition: "all 0.35s ease",
                   opacity: i === 0 ? 1 : 0.62,
                   background: i === 0 ? "rgba(216, 207, 188, 0.16)" : "rgba(18, 20, 15, 0.72)"
                 }}>
              <div className="card-num" style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--accent)", letterSpacing: "1px", transition: "text-shadow 0.3s ease", textShadow: i === 0 ? "0 0 12px #00ff8860" : "none" }}>{ft.num}</div>
              <div className="motioncode-feature-card-title" style={{ fontFamily: "var(--font-mono)", fontSize: "18px", color: "var(--text)", fontWeight: 700, margin: "6px 0" }}>{ft.title}</div>
              <div className="motioncode-feature-card-desc" style={{ fontSize: "13px", lineHeight: 1.6 }}>{ft.desc}</div>
            </div>
          ))}
          </div>
        </div>

        <div className="motioncode-feature-visual" style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {FEATURES_DATA.map((ft, i) => (
            <div key={ft.num}
                 ref={el => { rightPanelsRef.current[i] = el; }}
                 data-testid="feature-panel"
                 data-active={i === 0 ? "true" : "false"}
                 style={{
                   position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px",
                   opacity: i === 0 ? 1 : 0, transform: i === 0 ? "scale(1)" : "scale(1.05)", filter: i === 0 ? "blur(0px)" : "blur(8px)", transition: "opacity 0.25s ease, filter 0.25s ease, transform 0.25s ease", willChange: "transform"
                 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "160px", fontWeight: 800, color: "#ffffff08", userSelect: "none" }}>{ft.num}</div>
              <div className="feature-title" style={{ fontFamily: "var(--font-mono)", fontSize: "28px", color: "#e2e8f0", marginTop: "-30px", zIndex: 10, willChange: "transform" }}>{ft.title}</div>
              <div className="feature-desc" style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--muted)", maxWidth: "320px", textAlign: "center", marginTop: "16px", lineHeight: 1.7, zIndex: 10, willChange: "transform" }}>{ft.desc}</div>
              <div
                data-testid="feature-code-snippet"
                className="feature-code-snippet"
                style={{
                marginTop: "32px", width: "280px", padding: "16px",
                fontFamily: "var(--font-mono)", fontSize: "11px", zIndex: 10, whiteSpace: "pre-line", textAlign: "left"
              }}>
                {ft.code}
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* SECTION 5 - HOW IT WORKS */}
      <section id="how-it-works" ref={processSectionRef}
               style={{ position: "relative", background: "var(--bg)", padding: "120px 10vw", borderBottom: "1px solid var(--border)" }}>

        <div style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", writingMode: "vertical-rl", textOrientation: "mixed", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#1a1a1a", letterSpacing: "3px" }}>
          03 /
        </div>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "2px" }}>Process</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "36px", color: "var(--text)", marginBottom: "64px", marginTop: "16px" }}>Three steps to production-ready code</div>

        <div className="flex flex-col md:flex-row" style={{ border: "1px solid #1a1a1a" }}>
          {[
            { num: "01", title: "Upload", desc: "Drop your video or GIF into the converter" },
            { num: "02", title: "Analyze", desc: "AI extracts every frame and reads the motion" },
            { num: "03", title: "Ship", desc: "Copy production code in CSS, GSAP, or Framer Motion" }
          ].map((st, i) => (
            <div key={st.num}
                 ref={el => { processStepsRef.current[i] = el; }}
                 className="motioncode-process-step flex-1 relative group"
                 style={{ padding: "48px 40px", borderRight: i === 2 ? "none" : "1px solid #1a1a1a", willChange: "transform", background: "linear-gradient(180deg, rgba(255,255,255,0.01) 0%, transparent 100%)", transition: "background 0.3s ease" }}>

              <div style={{ position: "absolute", top: 0, left: 0, width: "0%", height: "2px", background: "#00ff88", transition: "width 0.3s ease", opacity: 0.8 }} className="group-hover:w-full" />
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "64px", color: "var(--border)", display: "block", marginBottom: "-16px", transform: "translateY(-16px)", transition: "color 0.3s ease", userSelect: "none" }} className="group-hover:text-[#ffffff0c]">{st.num}</div>

              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#00ff88", letterSpacing: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "6px", height: "6px", background: "#00ff88", borderRadius: "50%", opacity: 0.8 }} className="animate-pulse" />
                {`STEP ${st.num}`}
              </div>

              <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", color: "#e2e8f0", margin: "16px 0 10px" }}>{st.title}</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--muted)", lineHeight: 1.7 }}>{st.desc}</div>
              {i < 2 && (
                <div className="motioncode-process-arrow" style={{ position: "absolute", right: "-16px", top: "50%", transform: "translateY(-50%)", fontFamily: "var(--font-mono)", color: "#1a1a1a", fontSize: "24px", zIndex: 10 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6 - PRICING */}
      <section id="pricing" className="motioncode-pricing-section">
        <div className="motioncode-section-index">04 /</div>
        <div className="motioncode-pricing-header">
          <div className="motioncode-pricing-kicker">Pricing</div>
          <h2>Pricing built for motion teams</h2>
          <p>
            Start with preview access, then scale into production exports and
            shared review as your motion system gets serious.
          </p>
        </div>

        <div className="motioncode-pricing-grid">
          {PRICING_TIERS.map((tier) => (
            <article
              key={tier.id}
              data-testid={`pricing-card-${tier.id}`}
              data-hovered="false"
              className={`motioncode-pricing-card ${tier.featured ? "motioncode-pricing-card-featured" : ""}`}
              onMouseEnter={(event) => setInteractiveHover(event, true)}
              onMouseLeave={(event) => setInteractiveHover(event, false)}
            >
              <div className="motioncode-pricing-card-top">
                <div>
                  <h3>{tier.name}</h3>
                  <p>{tier.description}</p>
                </div>
                {tier.featured && <span className="motioncode-pricing-badge">most used</span>}
              </div>
              <div className="motioncode-pricing-rate">
                <span
                  data-testid={`price-${tier.id}`}
                  className="motioncode-pricing-price"
                >
                  {tier.price}
                </span>
                <span>{tier.period}</span>
              </div>
              <ul className="motioncode-pricing-features">
                {tier.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link href={tier.href} className="motioncode-pricing-cta">
                {tier.cta} →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 7 - CTA */}
      <section data-testid="final-cta" className="motioncode-final-cta">
        <div className="motioncode-section-index">05 /</div>
        <div className="motioncode-final-cta-rule" />
        <h2>Start converting animations today.</h2>

        <div className="motioncode-final-cta-meta">
          <InlineMotionBadge tone="capture" delay="0.2s">4 frameworks</InlineMotionBadge>
          <InlineMotionBadge tone="analyze" delay="0.5s">&lt; 30s analysis</InlineMotionBadge>
          <InlineMotionBadge tone="quiet" variant="dot">reviewable output</InlineMotionBadge>
        </div>

        <Link href="/app" className="motioncode-final-cta-button">
          Launch Converter →
        </Link>
      </section>

      {/* SECTION 8 - FOOTER */}
      <footer className="motioncode-footer">
        <div className="motioncode-footer-top">
          <div className="motioncode-footer-brand-block">
            <div className="motioncode-footer-brand">⟨/⟩ MotionCode</div>
            <div className="motioncode-footer-tagline">Intelligence for motion.</div>
            <div className="motioncode-footer-badges">
              <span>4 frameworks</span>
              <span>&lt; 30s analysis</span>
              <span>open beta</span>
            </div>
          </div>

          <div className="motioncode-footer-links">
            <div>
              <div className="motioncode-footer-heading">Product</div>
              {[
                ["Converter", "/app"],
                ["Pricing", "#pricing"],
                ["Examples", "/examples"],
                ["Support", "/support"],
              ].map(([label, href]) => (
                <Link key={label} href={href} className="motioncode-footer-link">
                  {label}
                </Link>
              ))}
            </div>

            <div>
              <div className="motioncode-footer-heading">Company</div>
              {["About", "Careers", "Blog", "Security"].map(link => (
                <Link key={link} href="#" className="motioncode-footer-link">
                  {link}
                </Link>
              ))}
            </div>

            <div>
              <div className="motioncode-footer-heading">Legal</div>
              {[
                ["Privacy", "/privacy"],
                ["Terms", "/terms"],
                ["SLA", "#"],
                ["DPA", "#"],
              ].map(([label, href]) => (
                <Link key={label} href={href} className="motioncode-footer-link">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="motioncode-footer-wordmark">MOTIONCODE</div>

        <div className="motioncode-footer-bottom">
          <div className="motioncode-footer-copy">
            © 2026 MotionCode. All rights reserved.
          </div>
          <div className="motioncode-footer-socials">
            {["Twitter ↗", "GitHub ↗", "LinkedIn ↗"].map(link => (
              <Link key={link} href="#" className="motioncode-footer-social">
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
