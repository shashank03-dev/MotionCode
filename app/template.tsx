"use client";

import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { detectDeviceTier } from "@/lib/device-tier";

// Flipped after the first template mount on the client. The server never runs
// effects, so it always renders the "first mount" (no shutter) markup.
let hasHydrated = false;

/**
 * Next.js creates a fresh template instance for each navigation, so a mount is
 * the transition. Client-side navigations get a camera shutter: a carbon plate
 * with the destination's slate lifts off the new page (CSS clip-path, see
 * `.route-shutter`). It is an overlay — the page itself is never transformed,
 * so fixed/sticky chrome doesn't jump, and the tree shape never changes.
 *
 * The first paint matches SSR (no shutter). Low-tier devices skip it, and
 * reduced motion turns it into a near-instant fade in CSS.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [shutter, setShutter] = useState(() => hasHydrated && detectDeviceTier() === "high");

  useEffect(() => {
    hasHydrated = true;
    if (!shutter) return;
    const done = window.setTimeout(() => setShutter(false), 900);
    return () => window.clearTimeout(done);
  }, [shutter]);

  const slate = pathname === "/" ? "/index" : pathname;

  return (
    <MotionConfig reducedMotion="user">
      <div className="h-full w-full">{children}</div>
      {shutter ? (
        <div className="route-shutter" aria-hidden>
          <span className="route-shutter__slate">
            <span className="route-shutter__dot" />
            {slate}
          </span>
        </div>
      ) : null}
    </MotionConfig>
  );
}
