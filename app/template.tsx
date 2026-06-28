"use client";

import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
