import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        mono: ["var(--font-space-mono)", "Space Mono", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        smoky: "#11120D",
        olive: "#565449",
        bone: "#D8CFBC",
        floral: "#FFFBF4",
        surface: "var(--surface)",
        border: "var(--border)",
        accent: "var(--accent)",
        muted: "var(--muted)",
      },
    },
  },
  plugins: [],
};
export default config;
