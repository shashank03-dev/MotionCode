import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "360px",
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-body)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "var(--font-space-mono)", "monospace"],
      },
      colors: {
        // App-shell tokens (consumed across dashboard / workbench / admin).
        background: "rgb(var(--bg-rgb) / <alpha-value>)",
        foreground: "rgb(var(--text-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        border: "var(--border)",
        muted: "rgb(var(--ink-3-rgb) / <alpha-value>)",
        // Shared marketing / design-system tokens (from the landing theme).
        canvas: "rgb(var(--bg-rgb) / <alpha-value>)",
        panel: "rgb(var(--surface-rgb) / <alpha-value>)",
        elevated: "rgb(var(--elevated-rgb) / <alpha-value>)",
        hairline: "var(--border)",
        "hairline-strong": "var(--border-strong)",
        ink: "rgb(var(--text-rgb) / <alpha-value>)",
        "ink-2": "rgb(var(--ink-2-rgb) / <alpha-value>)",
        "ink-3": "rgb(var(--ink-3-rgb) / <alpha-value>)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-dim": "var(--accent-dim)",
        "accent-glow": "var(--accent-glow)",
        "accent-border": "var(--accent-border)",
        // Chronograph palette — carbon darkroom, bone ink, paper plates.
        carbon: "rgb(var(--carbon-rgb) / <alpha-value>)",
        bone: "rgb(var(--bone-rgb) / <alpha-value>)",
        paper: "rgb(var(--paper-rgb) / <alpha-value>)",
        "paper-ink": "rgb(var(--paper-ink-rgb) / <alpha-value>)",
        "paper-ink-2": "var(--paper-ink-2)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        // shadcn primitives (components/ui/button.tsx) mapped onto the palette.
        primary: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          foreground: "rgb(var(--carbon-rgb) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--elevated-rgb) / <alpha-value>)",
          foreground: "rgb(var(--text-rgb) / <alpha-value>)",
        },
        destructive: "var(--danger)",
        input: "var(--border-strong)",
        ok: "var(--ok)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
        // shadcn `border-ring`; kept out of `colors` so it can't collide with
        // the `shadow-ring` box-shadow token.
        ring: "rgb(var(--accent-rgb) / <alpha-value>)",
      },
      ringColor: {
        ring: "rgb(var(--accent-rgb) / <alpha-value>)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "22px",
      },
      boxShadow: {
        ring: "inset 0 0 0 1px var(--border)",
        "ring-accent": "inset 0 0 0 1px var(--accent-border)",
        lift: "0 0.5px 0 0.5px rgba(237,235,228,0.05), 0 24px 60px -20px rgba(0,0,0,0.85)",
        glow: "0 0 0 1px var(--accent-border), 0 0 40px -8px var(--accent-glow)",
      },
      letterSpacing: {
        tightest: "-0.045em",
        tighter2: "-0.03em",
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(.16,1,.3,1)",
        chrono: "cubic-bezier(.65,0,.35,1)",
        "out-quint": "cubic-bezier(.22,1,.36,1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(.2,.8,.2,1) both",
        marquee: "marquee 40s linear infinite",
        "fade-in": "fade-up 0.7s cubic-bezier(.16,1,.3,1) both",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
