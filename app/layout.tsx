import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://motioncode.vercel.app"),
  title: {
    default: "MotionCode - Motion References to Starter Code",
    template: "%s | MotionCode",
  },
  description:
    "Turn short animation references into reviewable motion specs and starter snippets for CSS, GSAP, and Framer Motion.",
  openGraph: {
    title: "MotionCode",
    description:
      "Review motion specs and starter snippets from short animation references.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, spaceMono.variable)}>
      <head>
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
