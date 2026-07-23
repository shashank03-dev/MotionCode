import type { Variants } from "framer-motion";

// Global signature easing — used everywhere for a coherent motion voice.
export const EASE = [0.2, 0.8, 0.2, 1] as const;
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.7, ease: EASE } },
};

export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

// Sensible defaults for scroll-reveal viewport triggering.
export const viewportOnce = { once: true, margin: "-12% 0px -12% 0px" } as const;
