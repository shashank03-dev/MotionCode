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
        sans: ["var(--font-body)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "var(--font-space-mono)", "monospace"],
      },
      colors: {
        // App-shell tokens (consumed across dashboard / workbench / admin).
        background: "var(--bg)",
        foreground: "var(--text)",
        surface: "var(--surface)",
        border: "var(--border)",
        muted: "var(--muted)",
        // Shared marketing / design-system tokens (from the landing theme).
        canvas: "var(--bg)",
        panel: "var(--surface)",
        elevated: "var(--elevated)",
        hairline: "var(--border)",
        "hairline-strong": "var(--border-strong)",
        ink: "var(--text)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        "accent-glow": "var(--accent-glow)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
        "3xl": "28px",
      },
      boxShadow: {
        ring: "inset 0 0 0 1px var(--border)",
        "ring-accent": "inset 0 0 0 1px var(--accent-border)",
        lift: "0 0.5px 0 0.5px rgba(255,255,255,0.06), 0 24px 60px -20px rgba(0,0,0,0.8)",
        glow: "0 0 0 1px var(--accent-border), 0 0 40px -8px var(--accent-glow)",
      },
      letterSpacing: {
        tightest: "-0.045em",
        tighter2: "-0.03em",
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(.2,.8,.2,1)",
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
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
