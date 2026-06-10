import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://motioncode.vercel.app"),
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
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className="antialiased">{children}</body>
    </html>
  );
}
