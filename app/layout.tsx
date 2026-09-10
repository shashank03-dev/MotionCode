import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { INTRO_GATE_SCRIPT } from "@/lib/intro-gate";
import "./globals.css";

// Body / UI face — San Francisco Pro, vendored as a variable woff2 covering
// wght 1–1000 and both optical sizes (Text ↔ Display). Shared with the site.
const sfPro = localFont({
  variable: "--font-sf",
  display: "swap",
  src: [
    { path: "./fonts/SF-Pro.woff2", weight: "1 1000", style: "normal" },
    { path: "./fonts/SF-Pro-Italic.woff2", weight: "1 1000", style: "italic" },
  ],
});

// Display face — PP Neue Montreal, the same grotesk used on the marketing site.
const neueMontreal = localFont({
  variable: "--font-ppnm",
  display: "swap",
  src: [
    { path: "./fonts/ppnm/ppneuemontreal-book.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ppnm/ppneuemontreal-italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/ppnm/ppneuemontreal-medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ppnm/ppneuemontreal-semibolditalic.woff2", weight: "600", style: "italic" },
    { path: "./fonts/ppnm/ppneuemontreal-bold.woff2", weight: "700", style: "normal" },
  ],
});

// Mono — JetBrains Mono for code and UI accents; don't let it block render.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motioncode.live";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MotionCode - Turn Animations Into Production Code",
    template: "%s | MotionCode",
  },
  description:
    "Upload a video. Get CSS, GSAP, and Framer Motion code instantly.",
  openGraph: {
    title: "MotionCode",
    description:
      "Turn animations into production code with MotionCode.",
  },
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${sfPro.variable} ${neueMontreal.variable} ${jetbrainsMono.variable}`}
      // The intro-gate script below stamps `data-intro` on this element before
      // React hydrates, so the client tree legitimately differs from the
      // server HTML here. Without this, React reports a hydration mismatch on
      // every page load. Scoped to <html>'s own attributes — children still
      // hydrate normally.
      suppressHydrationWarning
    >
      <head>
        {/*
          Decides the landing intro BEFORE first paint. Running this in <head>
          (rather than in React) is the whole point: a returning visitor's
          markup is already stamped `data-intro="seen"` when the first frame
          paints, so the overlay is never briefly visible and then removed.
          Doing this after hydration would guarantee exactly that flash.

          Setting the flag here — not when the animation ends — means a reload
          part-way through the intro doesn't replay it. Once per session.

          The `catch` covers Safari private mode, where touching sessionStorage
          throws: on failure we degrade to "seen", i.e. no overlay at all,
          because showing an intro we might not be able to dismiss is worse
          than showing none.
        */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE_SCRIPT }} />
        {/*
          Without JS the overlay can never animate itself away, so hide it
          outright rather than trapping the page behind it.
        */}
        <noscript>
          <style>{`.mc-preloader{display:none !important}`}</style>
        </noscript>
      </head>
      <body className="antialiased" style={{ fontOpticalSizing: "auto" }}>
        {children}
        {modal}
        <SpeedInsights />
      </body>
    </html>
  );
}
