"use client";

/* eslint-disable @next/next/no-img-element -- Partner logos are tiny external Simple Icons SVG marks, not LCP content. */
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Magnet } from "@/components/react-bits";
import { SplitText } from "@/components/marketing/split-text";

// Aurora is a WebGL/OGL background that cannot render on the server. Loading it
// lazily keeps the ~ogl shader code out of the initial bundle so the hero text
// paints first; the decorative canvas hydrates in just after.
const Aurora = dynamic(() => import("@/components/react-bits/Aurora/Aurora"), {
  ssr: false,
});

// The handoff diagram is below the fold and is the only consumer of GSAP's
// MotionPathPlugin. Code-splitting it keeps that plugin and ~250 lines of
// markup/animation out of the landing page's initial chunk.
const HandoffBridge = dynamic(
  () => import("@/components/marketing/handoff-bridge"),
);
import { CheckoutButton } from "@/app/pricing/CheckoutButton";
import { MarketingAuthNavActions } from "@/components/marketing/auth-nav-actions";
import { ScrollSolutionBridge } from "@/components/marketing/scroll-solution-bridge";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// Motion preference lives in localStorage and is read through an external
// store so the component never sets state inside an effect. The server (and
// first client paint) always report "enabled" to avoid a hydration mismatch;
// after hydration the real preference — an explicit saved choice, else the OS
// reduced-motion setting — is read on the client.
const MOTION_PREFERENCE_KEY = "motioncode:motion";
const motionPreferenceListeners = new Set<() => void>();

function readMotionPreference(): boolean {
  try {
    const saved = window.localStorage.getItem(MOTION_PREFERENCE_KEY);
    if (saved === "off") return false;
    if (saved === "on") return true;
  } catch {
    /* localStorage blocked (private mode) — fall through to OS preference. */
  }
  try {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return true;
  }
}

function subscribeMotionPreference(onChange: () => void) {
  motionPreferenceListeners.add(onChange);
  return () => {
    motionPreferenceListeners.delete(onChange);
  };
}

function writeMotionPreference(next: boolean) {
  try {
    window.localStorage.setItem(MOTION_PREFERENCE_KEY, next ? "on" : "off");
  } catch {
    /* ignore persistence failures; the in-memory choice still applies. */
  }
  motionPreferenceListeners.forEach((listener) => listener());
}

const GLITCH_CHARS = "!<>-_\\/[]{}-=+*^?#________";
const scrambleText = (element: HTMLElement | null, finalString: string, goingOut: boolean = false) => {
  if (!element) return;
  let iteration = 0;
  const intervalId = element.getAttribute('data-interval-id');
  if (intervalId) clearInterval(parseInt(intervalId));

  const stepTime = 20;
  const totalSteps = 12;
  const charsPerStep = Math.max(1, finalString.length / totalSteps);

  const interval = setInterval(() => {
    // textContent (not innerText): innerText is layout-aware and forces a
    // reflow on every write — and this runs every 20ms while a panel
    // transition fires during the pinned scroll. textContent skips that.
    element.textContent = finalString
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
        element.textContent = finalString;
      }
    }

    iteration += charsPerStep;
  }, stepTime);

  element.setAttribute('data-interval-id', interval.toString());
};

const FEATURES_DATA = [
  { num: "01", title: "Upload Any Format", desc: "Drag in MP4, GIF, WebM, or Lottie files. Our engine handles any animation source with frame-perfect accuracy.", code: "// 8 frames extracted\n> format: MP4 → JPEG\n> resolution: 1920×1080" },
  { num: "02", title: "AI Frame Analysis", desc: "Neural networks decompose motion into discrete keyframes, easing curves, and transform paths automatically.", code: "// motion analyzed\n> keyframes: 12\n> easing: cubic-bezier(...)" },
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

const PROCESS_STEPS = [
  {
    num: "01",
    meta: "Source",
    title: "Capture the reference",
    desc: "Drop in a video or GIF. MotionCode samples frames and timing so the source stays visible through analysis.",
    output: "Frames + timing",
  },
  {
    num: "02",
    meta: "Motion map",
    title: "Map the motion",
    desc: "MotionCode turns sampled frames into transform paths, easing, duration, and intent you can inspect.",
    output: "Curves + keyframes + intent",
  },
  {
    num: "03",
    meta: "Export",
    title: "Review and export",
    desc: "Copy CSS, GSAP, or Framer Motion snippets with accessibility fallbacks and handoff notes attached.",
    output: "Code + fallbacks + notes",
  },
];

const PROCESS_FRAME_TILES = ["00", "06", "12", "18", "24", "30"];
const PROCESS_CURVE_POINTS = [
  { left: "10%", top: "68%" },
  { left: "30%", top: "34%" },
  { left: "54%", top: "48%" },
  { left: "78%", top: "22%" },
];
const PROCESS_EXPORT_ROWS = [
  ["CSS", "ready"],
  ["GSAP", "timed"],
  ["Motion", "mapped"],
  ["A11y", "fallback"],
];

const LOGO_BRANDS = [
  { name: "GitHub", icon: "github" },
  { name: "Vercel", icon: "vercel" },
  { name: "Stripe", icon: "stripe" },
  { name: "Cloudflare", icon: "cloudflare" },
  { name: "Supabase", icon: "supabase" },
  { name: "Razorpay", icon: "razorpay" },
  { name: "Linear", icon: "linear" },
  { name: "Figma", icon: "figma" },
  { name: "Notion", icon: "notion" },
  { name: "Loom", icon: "loom" },
  { name: "Raycast", icon: "raycast" },
  { name: "Resend", icon: "resend" },
];

const LOGO_SPLIT_DELAY_BASE = 14;

type LandingPricingTierBase = {
  cta: string;
  description: string;
  featured?: boolean;
  features: string[];
  name: string;
  period: string;
  price: string;
};

type LandingPricingTier =
  | (LandingPricingTierBase & {
      href: string;
      id: "preview";
    })
  | (LandingPricingTierBase & {
      id: "pro" | "studio";
    });

const PRICING_TIERS: LandingPricingTier[] = [
  {
    id: "preview",
    name: "Preview",
    price: "₹0",
    period: "during beta",
    description: "Explore the converter, inspect generated snippets, and validate short UI motion references.",
    features: ["10 analyses per month", "CSS and GSAP draft output", "Community support"],
    cta: "Start preview",
    href: "/app",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹100",
    period: "/ month",
    description: "For individual production motion work.",
    features: ["Priority analysis queue", "CSS, GSAP, and Framer Motion bundles", "Saved projects", "Email support"],
    cta: "Pay with Razorpay",
    featured: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: "₹500",
    period: "/ month",
    description: "For teams managing shared animation systems.",
    features: ["Team workspaces", "Private motion library", "Design token mapping", "Priority support"],
    cta: "Pay with Razorpay",
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

// Each trust-rail logo loads its mark from the Simple Icons CDN, but degrades to
// an on-theme monogram tile if the request fails (slow network, blocked CDN, or
// an icon slug that 404s). This keeps the marquee from ever showing a blank gap
// and gives every brand a consistent, branded footprint.
function LogoMark({ brand }: { brand: { name: string; icon: string } }) {
  const [iconFailed, setIconFailed] = React.useState(false);

  return (
    <span className="motioncode-logo-mark">
      <span className="motioncode-logo-glyph" aria-hidden="true">
        {iconFailed ? (
          <span className="motioncode-logo-monogram">
            {brand.name.charAt(0)}
          </span>
        ) : (
          <img
            src={`https://cdn.simpleicons.org/${brand.icon}/D8CFBC`}
            alt=""
            aria-hidden="true"
            className="motioncode-logo-img"
            loading="lazy"
            decoding="async"
            onError={() => setIconFailed(true)}
          />
        )}
      </span>
      <SplitText
        text={brand.name}
        className="motioncode-logo-name motioncode-split-text"
        delayStep={LOGO_SPLIT_DELAY_BASE}
      />
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

  const processSectionRef = useRef<HTMLElement>(null);
  const processStepsRef = useRef<(HTMLElement | null)[]>([]);

  const logoStripRef = useRef<HTMLElement>(null);

  // Motion is the user's call: on by default, with an explicit toggle that
  // persists in localStorage. Reading through useSyncExternalStore keeps SSR
  // and first client paint at `true` (no hydration mismatch) while applying any
  // saved "off" choice — or the OS reduced-motion default — right after
  // hydration, without setting state inside an effect. The whole GSAP setup
  // keys off this flag, so flipping it tears the animations down and rebuilds
  // them (or builds the static version).
  const motionEnabled = React.useSyncExternalStore(
    subscribeMotionPreference,
    readMotionPreference,
    () => true,
  );

  const toggleMotion = React.useCallback(() => {
    writeMotionPreference(!readMotionPreference());
  }, []);

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
    // Cache the last values we actually wrote. Writing `--motioncode-nav-width`
    // re-lays-out the glass nav and forces its backdrop-filter to recomposite,
    // so doing it every scroll frame — even when the rounded value is identical,
    // which it is for the whole duration of the pinned Features section — is
    // pure stutter. Only touch the DOM when something genuinely changed.
    let lastWidth = "";
    let lastDensity = "";
    let lastScrollY = -1;

    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);

    const writeNavVars = (width: string, density: string) => {
      const nav = navRef.current;
      if (!nav) return;
      if (width !== lastWidth) {
        nav.style.setProperty("--motioncode-nav-width", width);
        lastWidth = width;
      }
      if (density !== lastDensity) {
        nav.style.setProperty("--motioncode-nav-density", density);
        lastDensity = density;
      }
    };

    const updateNavShape = () => {
      const nav = navRef.current;
      if (!nav) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (viewportWidth < 768) {
        writeNavVars("calc(100vw - 28px)", "0");
        return;
      }

      // Bail before any forced layout if the scroll position is unchanged
      // since the last run (ScrollTrigger can fire onUpdate without scrollY
      // actually moving). Saves 3 getBoundingClientRect + a scrollHeight read.
      const scrollY = window.scrollY;
      if (scrollY === lastScrollY) return;
      lastScrollY = scrollY;

      const expandedWidth = Math.min(1020, viewportWidth - 64);
      const compactWidth = Math.max(790, expandedWidth - 190);
      const heroProgress = clamp(scrollY / (viewportHeight * 0.76), 0, 1);

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
      const density = clamp(heroProgress - sectionExpansion * 0.35, 0, 1);

      writeNavVars(`${Math.round(width)}px`, density.toFixed(3));
    };

    const requestNavShapeUpdate = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateNavShape);
    };

    updateNavShape();
    const navScrollTrigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: () =>
        `+=${Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight,
        )}`,
      onUpdate: requestNavShapeUpdate,
    });
    window.addEventListener("resize", requestNavShapeUpdate);

    return () => {
      window.cancelAnimationFrame(rafId);
      navScrollTrigger.kill();
      window.removeEventListener("resize", requestNavShapeUpdate);
    };
  }, []);

  // Smooth in-page anchor navigation. We deliberately dropped CSS
  // `scroll-behavior: smooth` (it stutters ScrollTrigger's pinned Features
  // section), so we drive anchor jumps through GSAP's ScrollToPlugin instead —
  // ScrollTrigger tracks GSAP-driven scrolls, so the pin stays smooth. Honours
  // prefers-reduced-motion by jumping instantly.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!anchor) return;

      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;

      const target = document.querySelector(hash);
      if (!(target instanceof HTMLElement)) return;

      // Capture phase + stopPropagation so this runs before Next's <Link>
      // click handler, which would otherwise hash-navigate with an instant
      // jump and pre-empt the GSAP scroll.
      event.preventDefault();
      event.stopPropagation();

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      // Clear the fixed nav so anchored sections aren't tucked under it.
      const offsetY = (navRef.current?.offsetHeight ?? 0) + 24;

      gsap.to(window, {
        duration: reduceMotion ? 0 : 0.9,
        ease: "power2.inOut",
        scrollTo: { y: target, offsetY, autoKill: true },
        onComplete: () => {
          if (history.replaceState) history.replaceState(null, "", hash);
        },
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Pause the logo marquee while it's off-screen. The marquee duplicates its
  // brands into ~156 per-character spans, each running an infinite shimmer with
  // `will-change` — i.e. 156 promoted compositor layers churning every frame.
  // Left running, that work happens even while you're scrolling the pinned
  // Features section below it, which is the main cause of the fast-scroll
  // stutter there. The `data-inview="false"` state (see globals.css) pauses
  // those animations and drops their `will-change` so the layers go idle.
  // Aurora, the hero field drift, and the terminal loop already gate this way;
  // the marquee was the one that didn't.
  useEffect(() => {
    const strip = logoStripRef.current;
    if (!strip) return;

    // Default to the paused/idle state; the observer flips it on when visible.
    strip.dataset.inview = "false";

    const observer = new IntersectionObserver(
      (entries) => {
        strip.dataset.inview = entries[0]?.isIntersecting ? "true" : "false";
      },
      { threshold: 0 },
    );
    observer.observe(strip);
    return () => observer.disconnect();
  }, []);

  const setInteractiveHover = (
    event: React.MouseEvent<HTMLElement>,
    hovered: boolean,
  ) => {
    event.currentTarget.setAttribute("data-hovered", hovered ? "true" : "false");
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Driven by the user's in-page toggle (default on), not the OS setting.
      const reduceMotion = !motionEnabled;

      const terminalLines = heroTermLinesRef.current.filter(Boolean);
      gsap.set(terminalLines, { autoAlpha: 1, y: 0 });

      // Give the ambient background terminal a heartbeat: loop a gentle
      // line-by-line "re-analyze" pulse, paused whenever the hero is offscreen
      // so it never burns compositor work nobody can see.
      if (!reduceMotion && terminalLines.length) {
        const termLoop = gsap.timeline({ repeat: -1, repeatDelay: 1.6 });
        terminalLines.forEach((line) => {
          termLoop.fromTo(
            line,
            { opacity: 0.42 },
            { opacity: 1, duration: 0.32, ease: "power2.out" },
            ">-0.14",
          );
        });
        termLoop.to({}, { duration: 0.9 });
        if (heroSectionRef.current) {
          ScrollTrigger.create({
            trigger: heroSectionRef.current,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) =>
              self.isActive ? termLoop.play() : termLoop.pause(),
          });
        }
      }

      // Count up the motion-lab metrics (intent %, morph vector) when the hero
      // scrolls into view — static final values under reduced-motion.
      gsap.utils.toArray<HTMLElement>("[data-countup]").forEach((el) => {
        const target = parseFloat(el.dataset.countup ?? "0");
        const decimals = parseInt(el.dataset.countupDecimals ?? "0", 10);
        const suffix = el.dataset.countupSuffix ?? "";
        const format = (value: number) => `${value.toFixed(decimals)}${suffix}`;

        if (reduceMotion) {
          el.textContent = format(target);
          return;
        }

        const counter = { value: 0 };
        el.textContent = format(0);
        gsap.to(counter, {
          value: target,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: "top 85%",
            once: true,
          },
          onUpdate: () => {
            el.textContent = format(counter.value);
          },
        });
      });

      // Setup Hero Animation — gated behind reduced-motion so the page honours
      // the accessibility promise it advertises.
      if (reduceMotion) {
        gsap.set(heroLinesRef.current, { y: "0%", opacity: 1 });
        gsap.set(heroSubtextRef.current, { opacity: 1 });
        gsap.set(".motioncode-hero-field-line, .motioncode-hero-field-tick", {
          opacity: 1,
          scaleX: 1,
        });
      } else {
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

        // Infinite drift — pause it whenever the hero scrolls offscreen so it
        // isn't burning compositor work for animation nobody can see.
        const fieldDrift = gsap.to(".motioncode-hero-field-line-b", {
          x: "-8%",
          duration: 7,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
        if (heroSectionRef.current) {
          ScrollTrigger.create({
            trigger: heroSectionRef.current,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) =>
              self.isActive ? fieldDrift.play() : fieldDrift.pause(),
          });
        }
      }

      if (!reduceMotion && heroSectionRef.current) {
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
      let featureTimeline: ReturnType<typeof gsap.timeline> | null = null;
      const compactFeaturesQuery = window.matchMedia("(max-width: 767px)");

      // Drive the active feature purely through data-active attributes — the
      // visual states live in CSS. onUpdate fires every frame while the section
      // is pinned, so we bail out unless the index actually changed; that is the
      // difference between a smooth pin and the per-frame style thrash that was
      // here before.
      const activateFeature = (index: number) => {
        if (index === lastIndex) return;
        const prevIndex = lastIndex;
        lastIndex = index;

        leftCardsRef.current.forEach((card, i) => {
          if (card) card.dataset.active = i === index ? "true" : "false";
        });

        rightPanelsRef.current.forEach((panel, i) => {
          if (!panel) return;
          const isActive = i === index;
          panel.dataset.active = isActive ? "true" : "false";

          const titleEl = panel.querySelector(".feature-title") as HTMLElement | null;
          const descEl = panel.querySelector(".feature-desc") as HTMLElement | null;

          if (isActive) {
            const codeLines = panel.querySelectorAll(".feature-code-line");
            if (reduceMotion) {
              if (titleEl) titleEl.textContent = FEATURES_DATA[i].title;
              if (descEl) descEl.textContent = FEATURES_DATA[i].desc;
              gsap.set(codeLines, { autoAlpha: 1, x: 0 });
            } else {
              if (titleEl) scrambleText(titleEl, FEATURES_DATA[i].title, false);
              if (descEl) scrambleText(descEl, FEATURES_DATA[i].desc, false);
              gsap.fromTo(
                codeLines,
                { autoAlpha: 0, x: -10 },
                {
                  autoAlpha: 1,
                  x: 0,
                  duration: 0.34,
                  stagger: 0.05,
                  ease: "power2.out",
                  overwrite: true,
                },
              );
            }
          } else if (!reduceMotion && i === prevIndex) {
            if (titleEl) scrambleText(titleEl, FEATURES_DATA[i].title, true);
            if (descEl) scrambleText(descEl, FEATURES_DATA[i].desc, true);
          }
        });
      };

      const resetFeatureCards = () => {
        leftCardsRef.current.forEach((card) => {
          if (card) card.dataset.active = "false";
        });
        rightPanelsRef.current.forEach((panel) => {
          if (panel) panel.dataset.active = "false";
        });
      };

      const clearFeatureTrigger = () => {
        if (featureTimeline) {
          // Killing the timeline kills its ScrollTrigger (and unpins) too.
          featureTimeline.scrollTrigger?.kill();
          featureTimeline.kill();
          featureTimeline = null;
        }
        if (featureTrigger) {
          featureTrigger.kill();
          featureTrigger = null;
        }
        // Hand the panels back to CSS: drop the inline transition lock and the
        // opacity/visibility/transform the scrub timeline was driving, so a
        // re-layout (e.g. resize into the compact breakpoint) starts clean.
        rightPanelsRef.current.forEach((panel) => {
          if (!panel) return;
          panel.style.transition = "";
          gsap.set(panel, { clearProps: "opacity,visibility,transform" });
        });
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

        // One viewport of scroll per *transition* between panels. With
        // NUM_FEATURES panels there are NUM_FEATURES - 1 transitions, so the pin
        // lasts that many viewports and progress maps linearly: panel i rests at
        // progress i / lastFeatureIndex. Every panel gets an identical dwell.
        // The old `* NUM_FEATURES + 0.35` mapping gave panel 1 only ~13% of the
        // scroll and the last panel ~27% — a rushed first card, a draggy last.
        const lastFeatureIndex = NUM_FEATURES - 1;
        const pinConfig = {
          trigger: featuresSectionRef.current,
          start: "top top",
          end: () => `+=${lastFeatureIndex * window.innerHeight}`,
          pin: true,
          // Let ScrollTrigger own the pin spacer instead of the old
          // `pinSpacing: false` + manual marginBottom hack — that mismatch is
          // what made the section snap/jump at the moment it pinned.
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        } as const;

        if (reduceMotion) {
          // Reduced motion: no scroll-scrubbed motion — instant, discrete swaps
          // driven by the CSS `data-active` states.
          featureTrigger = ScrollTrigger.create({
            ...pinConfig,
            onUpdate: (self) => {
              const index = Math.round(self.progress * lastFeatureIndex);
              activateFeature(index);
            },
          });
          activateFeature(0);
          ScrollTrigger.refresh();
          return;
        }

        // Motion on: drive the right-hand panel crossfade from a scroll-scrubbed
        // timeline so the fade tracks scroll position 1:1 and stays smooth at any
        // scroll speed — instead of firing a fixed-duration CSS transition on each
        // discrete index flip (which can't keep up with a normal/fast scroll and
        // reads as a stutter). GSAP owns opacity/visibility/transform here, so we
        // disable the CSS transition that would otherwise lag the scrub.
        // Keep index alignment with FEATURES_DATA (activateFeature indexes the
        // same ref array), so no filtering — just guard nulls.
        const panels = rightPanelsRef.current;
        panels.forEach((panel, i) => {
          if (!panel) return;
          panel.style.transition = "none";
          gsap.set(panel, {
            autoAlpha: i === 0 ? 1 : 0,
            y: i === 0 ? 0 : 18,
            scale: i === 0 ? 1 : 0.985,
          });
        });

        featureTimeline = gsap.timeline({
          // ease:"none" keeps the fade linear against scroll; `scrub` adds the
          // brief catch-up that makes fast flings feel buttery instead of abrupt.
          defaults: { ease: "none" },
          scrollTrigger: {
            ...pinConfig,
            scrub: 0.5,
            onUpdate: (self) => {
              const index = Math.round(self.progress * lastFeatureIndex);
              activateFeature(index);
            },
          },
        });

        // Each segment [i, i+1] crossfades panel i out and panel i+1 in over one
        // viewport of scroll. At every integer point exactly one panel rests fully
        // visible, so the dwell per feature is identical.
        for (let i = 0; i < lastFeatureIndex; i++) {
          const outgoing = panels[i];
          const incoming = panels[i + 1];
          if (!outgoing || !incoming) continue;
          featureTimeline
            .to(outgoing, { autoAlpha: 0, y: -18, scale: 0.985 }, i)
            .to(incoming, { autoAlpha: 1, y: 0, scale: 1 }, i);
        }

        featureTrigger = featureTimeline.scrollTrigger ?? null;

        activateFeature(0);
        ScrollTrigger.refresh();
      };

      applyFeatureLayout();
      compactFeaturesQuery.addEventListener("change", applyFeatureLayout);

      // Entrance: the left step cards rise + fade in with a stagger the first
      // time the section approaches the viewport, so they never read as static.
      // clearProps hands control back to the CSS hover/active transforms.
      if (!reduceMotion && featuresSectionRef.current) {
        const cards = leftCardsRef.current.filter(Boolean) as HTMLElement[];
        gsap.from(cards, {
          autoAlpha: 0,
          y: 24,
          duration: 0.55,
          stagger: 0.08,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility",
          scrollTrigger: {
            trigger: featuresSectionRef.current,
            start: "top 78%",
            once: true,
          },
        });
      }

      // Setup Process Steps Animation
      if (processSectionRef.current && processStepsRef.current.length > 0) {
        if (reduceMotion) {
          gsap.set(processStepsRef.current, { opacity: 1, y: 0 });
        } else {
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
      }

      return () => {
        compactFeaturesQuery.removeEventListener("change", applyFeatureLayout);
        clearFeatureTrigger();
        // scrambleText runs on setInterval outside GSAP's control — clear any
        // in-flight scrambles so they don't fire on a detached node.
        rightPanelsRef.current.forEach((panel) => {
          panel?.querySelectorAll<HTMLElement>("[data-interval-id]").forEach((el) => {
            const id = el.getAttribute("data-interval-id");
            if (id) clearInterval(parseInt(id, 10));
            el.removeAttribute("data-interval-id");
          });
        });
      };
    });

    return () => {
      ctx.revert();
    };
  }, [motionEnabled]);

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
          <Magnet
            padding={30}
            magnetStrength={9}
            wrapperClassName="motioncode-nav-brand-magnet"
          >
            <Link href="/" className="motioncode-nav-brand">
              <span className="motioncode-nav-brand-glyph" aria-hidden="true">
                ⟨/⟩
              </span>
              <span className="motioncode-nav-brand-text">MotionCode</span>
            </Link>
          </Magnet>

          <div className="motioncode-nav-menu" aria-label="Landing sections">
            <Magnet
              padding={24}
              magnetStrength={10}
              wrapperClassName="motioncode-nav-link-magnet"
            >
              <Link href="#features" className="motioncode-nav-link">
                Features
              </Link>
            </Magnet>
            <Magnet
              padding={24}
              magnetStrength={10}
              wrapperClassName="motioncode-nav-link-magnet"
            >
              <Link href="#how-it-works" className="motioncode-nav-link">
                How it Works
              </Link>
            </Magnet>
            <Magnet
              padding={24}
              magnetStrength={10}
              wrapperClassName="motioncode-nav-link-magnet"
            >
              <Link href="#pricing" className="motioncode-nav-link">
                Pricing
              </Link>
            </Magnet>
          </div>

          <MarketingAuthNavActions variant="landing" />
        </div>
      </nav>

      {/* SECTION 2 - HERO */}
      <section ref={heroSectionRef}
               data-hero-v2
               className="motioncode-hero-section relative w-full overflow-hidden"
               style={{
                 minHeight: "100dvh",
                 borderBottom: "1px solid var(--border)"
               }}>
        <div className="motioncode-aurora-layer" aria-hidden="true">
          <Aurora
            colorStops={["#D8CFBC", "#00FF88", "#126137"]}
            amplitude={1.25}
            blend={0.46}
            speed={0.62}
          />
        </div>

        {/* Readability scrim — sits above the ambient motion-lab layer but below
            the headline column so text stays crisp over the live panels. */}
        <div className="motioncode-hero-scrim" aria-hidden="true" />

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

        <div className="motioncode-hero-content">
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
          <Link href="#motion-bridge"
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
        </div>

        <div
          ref={heroTerminalRef}
          data-testid="motion-lab-preview"
          data-hovered="false"
          className="motion-lab-preview motion-lab-bg hidden lg:block"
          aria-hidden="true"
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
              <strong data-countup="94" data-countup-suffix="%">94%</strong>
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
                <strong data-countup="0.84" data-countup-decimals="2">0.84</strong>
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

      {/* SECTION 3 - SCROLL BRIDGE */}
      <ScrollSolutionBridge />

      {/* TEAM HANDOFF - code-split below-the-fold GSAP/MotionPath section */}
      <HandoffBridge />

      {/* SECTION 4 - LOGO STRIP */}
      <section
        ref={logoStripRef}
        data-testid="logo-strip"
        className="motioncode-logo-strip"
        aria-labelledby="logo-strip-heading"
      >
        <p id="logo-strip-heading" className="motioncode-logo-kicker">
          Fits beside the tools motion teams already use
        </p>
        <div className="motioncode-logo-marquee">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="motioncode-logo-track"
              aria-hidden={i === 1 ? true : undefined}
            >
              {LOGO_BRANDS.map(brand => (
                <LogoMark key={`${i}-${brand.name}`} brand={brand} />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5 - LOGO/FEATURES (STICKY SCROLL) */}
      <section id="features" ref={featuresSectionRef} className="motioncode-feature-section"
               style={{ position: "relative", height: "100vh", overflow: "hidden", display: "flex", borderBottom: "1px solid var(--border)" }}>

        <div style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", writingMode: "vertical-rl", textOrientation: "mixed", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#1a1a1a", letterSpacing: "3px" }}>
          03 /
        </div>

        <div className="motioncode-feature-list" style={{ width: "48%", padding: "60px 40px", position: "relative", display: "flex", flexDirection: "column" }}>
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
                 style={{ "--card-index": i } as React.CSSProperties}>
              <span className="motioncode-feature-card-bar" aria-hidden="true" />
              <div className="card-num" style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--accent)", letterSpacing: "1px" }}>{ft.num}</div>
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
                 className="motioncode-feature-panel"
                 style={{
                   position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px"
                 }}>
              <div className="motioncode-feature-panel-ghost" style={{ fontFamily: "var(--font-mono)", fontSize: "160px", fontWeight: 800, color: "#ffffff08", userSelect: "none" }}>{ft.num}</div>
              <div className="feature-title" style={{ fontFamily: "var(--font-mono)", fontSize: "28px", color: "#fffbf4", marginTop: "-30px", zIndex: 10 }}>{ft.title}</div>
              <div className="feature-desc" style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--muted)", maxWidth: "320px", textAlign: "center", marginTop: "16px", lineHeight: 1.7, zIndex: 10 }}>{ft.desc}</div>
              <div
                data-testid="feature-code-snippet"
                className="feature-code-snippet"
                style={{
                marginTop: "32px", width: "280px", padding: "16px",
                fontFamily: "var(--font-mono)", fontSize: "11px", zIndex: 10, textAlign: "left"
              }}>
                {ft.code.split("\n").map((line, li) => (
                  <span className="feature-code-line" key={li}>{line || " "}</span>
                ))}
                <span className="feature-code-cursor" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* SECTION 6 - HOW IT WORKS */}
      <section
        id="how-it-works"
        ref={processSectionRef}
        className="motioncode-process-section"
        aria-labelledby="process-heading"
      >
        <div className="motioncode-process-shell">
          <div className="motioncode-process-header">
            <div>
              <p className="motioncode-process-kicker">Workflow</p>
              <h2 id="process-heading">From reference clip to reviewable motion code</h2>
            </div>
            <p>
              Upload a clip, inspect the sampled frames and motion spec, then
              export framework snippets with fallbacks and handoff notes.
            </p>
          </div>

          <ol className="motioncode-process-grid" aria-label="MotionCode process">
            {PROCESS_STEPS.map((st, i) => (
              <li
                key={st.num}
                ref={(el) => {
                  processStepsRef.current[i] = el;
                }}
                className="motioncode-process-step"
              >
                <div className="motioncode-process-step-top">
                  <span className="motioncode-process-num" aria-hidden="true">
                    {st.num}
                  </span>
                  <span className="sr-only">{`Step ${i + 1} of ${PROCESS_STEPS.length}`}</span>
                  <span className="motioncode-process-meta">{st.meta}</span>
                </div>

                <div>
                  <h3>{st.title}</h3>
                  <p>{st.desc}</p>
                </div>

                <div className="motioncode-process-artifact" aria-hidden="true">
                  {i === 0 ? (
                    <div className="motioncode-process-frames">
                      {PROCESS_FRAME_TILES.map((frame) => (
                        <span key={frame}>{frame}</span>
                      ))}
                    </div>
                  ) : null}
                  {i === 1 ? (
                    <div className="motioncode-process-curve">
                      <span className="motioncode-process-curve-line" />
                      {PROCESS_CURVE_POINTS.map((point, pointIndex) => (
                        <span
                          key={`${point.left}-${point.top}`}
                          className="motioncode-process-curve-node"
                          style={{
                            left: point.left,
                            top: point.top,
                            animationDelay: `${pointIndex * 0.18}s`,
                          }}
                        />
                      ))}
                      <div className="motioncode-process-spec-readout">
                        <span>duration 640ms</span>
                        <span>ease out-cubic</span>
                      </div>
                    </div>
                  ) : null}
                  {i === 2 ? (
                    <div className="motioncode-process-exports">
                      {PROCESS_EXPORT_ROWS.map(([label, value]) => (
                        <span key={label}>
                          <strong>{label}</strong>
                          <em>{value}</em>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="motioncode-process-output">
                  <span>{st.output}</span>
                </div>
              </li>
            ))}
          </ol>

          <div className="motioncode-process-rail" aria-hidden="true">
            <span />
            <span />
          </div>
        </div>
      </section>

      {/* SECTION 7 - PRICING */}
      <section id="pricing" className="motioncode-pricing-section">
        <div className="motioncode-section-index">05 /</div>
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
              {tier.id === "preview" ? (
                <Link href={tier.href} className="motioncode-pricing-cta">
                  {tier.cta} →
                </Link>
              ) : (
                <div className="motioncode-pricing-checkout">
                  <CheckoutButton planTier={tier.id} />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 8 - CTA */}
      <section data-testid="final-cta" className="motioncode-final-cta">
        <div className="motioncode-section-index">06 /</div>
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

      {/* SECTION 9 - FOOTER */}
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
                ["Features", "#features"],
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
          <button
            type="button"
            onClick={toggleMotion}
            className="motioncode-motion-toggle"
            data-on={motionEnabled ? "true" : "false"}
            role="switch"
            aria-checked={motionEnabled}
            aria-label="Toggle site animations"
          >
            <span className="motioncode-motion-toggle-dot" aria-hidden="true" />
            <span className="motioncode-motion-toggle-label">
              Motion {motionEnabled ? "on" : "off"}
            </span>
          </button>
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
