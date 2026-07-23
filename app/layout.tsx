import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
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
    { path: "./fonts/ppnm/ppneuemontreal-thin.otf", weight: "100", style: "normal" },
    { path: "./fonts/ppnm/ppneuemontreal-book.otf", weight: "400", style: "normal" },
    { path: "./fonts/ppnm/ppneuemontreal-italic.otf", weight: "400", style: "italic" },
    { path: "./fonts/ppnm/ppneuemontreal-medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/ppnm/ppneuemontreal-semibolditalic.otf", weight: "600", style: "italic" },
    { path: "./fonts/ppnm/ppneuemontreal-bold.otf", weight: "700", style: "normal" },
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
    >
      <head />
      <body className="antialiased" style={{ fontOpticalSizing: "auto" }}>
        {children}
        {modal}
      </body>
    </html>
  );
}
