import {
  Film,
  GitBranch,
  Code2,
  Gauge,
  FolderGit2,
  Accessibility,
  type LucideIcon,
} from "lucide-react";

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "Support", href: "/support" },
];

export type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  span?: "wide" | "tall";
};

export const FEATURES: Feature[] = [
  {
    icon: Film,
    title: "Frame extraction",
    body: "Drop a clip and MotionCode pulls the representative frames — the exact moments where the motion changes state.",
    span: "wide",
  },
  {
    icon: GitBranch,
    title: "Normalized motion spec",
    body: "Duration, delay, easing and keyframes distilled into one clean, portable spec you can trust.",
  },
  {
    icon: Code2,
    title: "Multi-target code",
    body: "Export the same motion as CSS, GSAP or Framer Motion — no hand-translation, no drift.",
  },
  {
    icon: Gauge,
    title: "Easing detection",
    body: "The real velocity curve, recovered from the footage and matched to the nearest cubic-bézier.",
    span: "tall",
  },
  {
    icon: FolderGit2,
    title: "Workspaces",
    body: "Keep references, specs and generated code together. Return to any analysis, read-only, whenever.",
  },
  {
    icon: Accessibility,
    title: "Reduced-motion output",
    body: "Every export ships a prefers-reduced-motion fallback by default. Accessible motion, for free.",
  },
];

export const STEPS = [
  {
    kicker: "01 — Reference",
    title: "Drop a motion reference",
    body: "A screen recording, a GIF, a product demo. Anything with the motion you want to reproduce.",
  },
  {
    kicker: "02 — Analyze",
    title: "Frames extracted, motion read",
    body: "MotionCode isolates the moving element, samples its trajectory and recovers the underlying timing curve.",
  },
  {
    kicker: "03 — Ship",
    title: "Spec and code, ready to paste",
    body: "A normalized spec plus production code for CSS, GSAP and Framer Motion — with a reduced-motion fallback.",
  },
];

export const PRICING = [
  {
    name: "Free",
    price: "$0",
    cadence: "/forever",
    blurb: "For trying the pipeline on a real reference.",
    features: [
      "5 analyses / month",
      "CSS + Framer export",
      "Reduced-motion fallback",
      "1 workspace",
    ],
    cta: "Start free",
    href: "/app",
    featured: false,
  },
  {
    name: "Pro",
    price: "$18",
    cadence: "/month",
    blurb: "For designers and engineers shipping motion daily.",
    features: [
      "Unlimited analyses",
      "CSS + GSAP + Framer export",
      "Easing curve editor",
      "Unlimited workspaces",
      "Version history",
    ],
    cta: "Go Pro",
    href: "/pricing",
    featured: true,
  },
  {
    name: "Team",
    price: "$49",
    cadence: "/month",
    blurb: "For teams keeping a shared motion language.",
    features: [
      "Everything in Pro",
      "Shared workspaces",
      "Motion tokens export",
      "SSO + roles",
      "Priority support",
    ],
    cta: "Talk to us",
    href: "/contact",
    featured: false,
  },
];

// Generic, non-impersonating role marks for the credibility strip.
export const TRUST_MARKS = [
  "PRODUCT DESIGN",
  "DESIGN ENGINEERING",
  "MOTION SYSTEMS",
  "DESIGN SYSTEMS",
  "FRONTEND PLATFORM",
  "CREATIVE DEV",
];
