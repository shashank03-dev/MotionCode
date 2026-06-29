"use client";

import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";

import { useDeviceTier } from "@/lib/device-tier";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const deviceTier = useDeviceTier();

  // On low-end / data-saving devices, skip the per-navigation framer-motion
  // mount + opacity tween entirely so every route change is instant. The hook
  // returns "high" on the server and first client paint (so SSR markup matches),
  // then settles after hydration — at which point a low-tier device drops the
  // animated wrapper and renders children directly.
  if (deviceTier === "low") {
    return <div className="h-full w-full">{children}</div>;
  }

  // `reducedMotion="user"` lets framer-motion skip the transition for users who
  // prefer reduced motion, without branching the render tree on a client-only
  // value (which causes an SSR/client hydration mismatch).
  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="h-full w-full"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
