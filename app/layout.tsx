import type { Metadata } from "next";
import { Archivo, Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Primary body + display fonts are above-the-fold, so they preload.
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const bridgeDisplay = Archivo({
  subsets: ["latin"],
  variable: "--font-bridge-display",
  display: "swap",
});

// Mono fonts are used for smaller UI accents; don't let them block render.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});

const bridgeMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-bridge-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} ${bridgeDisplay.variable} ${bridgeMono.variable}`}
    >
      <head />
      <body className="antialiased">
        {children}
        {modal}
      </body>
    </html>
  );
}
