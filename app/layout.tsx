import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";

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
    "Upload motion media and generate validated CSS, GSAP, Framer Motion, and React Spring snippets through server-side Gemini analysis.",
  openGraph: {
    title: "MotionCode",
    description:
      "Turn animation references into validated frontend motion snippets.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
