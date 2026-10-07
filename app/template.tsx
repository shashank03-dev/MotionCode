"use client";

import { motion, MotionConfig } from "framer-motion";
import { useEffect, useState } from "react";

import { detectDeviceTier } from "@/lib/device-tier";

// Flipped after the first template mount on the client. The server never runs
// effects, so it always renders the "first mount" (no fade) markup.
let hasHydrated = false;

/**
 * Next.js creates a fresh template instance for each navigation, so a mount is
 * the transition: client-side navigations fade the new page in. The tree shape
 * never changes after mount. Swapping wrappers (or keying an AnimatePresence
 * by pathname) remounts the whole page, which drops in-progress state and,
 * while an exit animation runs, renders the current route twice.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  // The first paint matches SSR (no fade, content visible immediately). Later
  // mounts are client-only, so reading the device tier synchronously is safe;
  // low-end / data-saving devices skip the tween entirely.
  const [fadeIn] = useState(() => hasHydrated && detectDeviceTier() === "high");

  useEffect(() => {
    hasHydrated = true;
  }, []);

  // `reducedMotion="user"` lets framer-motion skip the transition for users who
  // prefer reduced motion without branching the render tree.
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={fadeIn ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}
