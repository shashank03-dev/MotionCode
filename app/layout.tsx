import type { Metadata, Viewport } from "next";
import { Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { INTRO_GATE_SCRIPT } from "@/lib/intro-gate";
import "./globals.css";

// Chronograph type system.
// Sans — Geist, vendored as a variable font: UI, body and display headings.
const geist = localFont({
  variable: "--font-geist",
  display: "swap",
  src: [{ path: "./fonts/GeistVF.woff", weight: "100 900", style: "normal" }],
});

// Mono — Geist Mono: timecodes, labels, specs and code.
const geistMono = localFont({
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
  src: [{ path: "./fonts/GeistMonoVF.woff", weight: "100 900", style: "normal" }],
});

// Serif — Instrument Serif, italic only in practice: the one editorial voice,
// reserved for accent words inside display headlines.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
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
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "MotionCode",
    description:
      "Turn animations into production code with MotionCode.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b0a",
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
      className={`dark ${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
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
      <body className="min-h-dvh overflow-x-clip antialiased" style={{ fontOpticalSizing: "auto" }}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-carbon"
        >
          Skip to content
        </a>
        <div id="main" tabIndex={-1}>{children}</div>
        {modal}
        <SpeedInsights />
      </body>
    </html>
  );
}
