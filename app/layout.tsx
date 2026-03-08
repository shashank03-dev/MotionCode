import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import Script from "next/script";
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
  title: "MotionCode — Turn Animations Into Production Code",
  description:
    "Upload a video. Get CSS, GSAP, and Framer Motion code instantly. The motion intelligence platform for developers.",
  openGraph: {
    images: ["/og-image.png"],
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
        <Script 
          src="https://js.puter.com/v2/" 
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
