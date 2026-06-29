"use client";

import { useEffect, useState } from "react";

// Device-tier detection for progressively downgrading expensive visuals
// (WebGL shaders, pointer-tracking effects, scroll-scrubbed timelines) on
// low-end or data-saving devices. The "low" tier should skip GPU/CPU-heavy
// work and fall back to cheap static styling so weaker phones stay smooth.
//
// Detection only ever *downgrades*: anything unknown defaults to "high" so the
// richest experience is the baseline and we only step down on a real signal.
// Thresholds below are intentionally conservative and easy to tune.

export type DeviceTier = "low" | "high";

type NavigatorWithTier = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
    addEventListener?: (type: "change", listener: () => void) => void;
    removeEventListener?: (type: "change", listener: () => void) => void;
  };
};

// Pure, synchronous check. Returns "high" on the server or when the relevant
// APIs are unavailable. Safe to call in a useState initializer for client-only
// components (e.g. an `ssr: false` WebGL canvas) to avoid a downgrade flash.
export function detectDeviceTier(): DeviceTier {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "high";
  }

  const nav = navigator as NavigatorWithTier;

  // Explicit data-saver request — honour it as a low-tier signal.
  if (nav.connection?.saveData) return "low";

  // Slow effective connection (Network Information API).
  const effectiveType = nav.connection?.effectiveType;
  if (
    effectiveType === "slow-2g" ||
    effectiveType === "2g" ||
    effectiveType === "3g"
  ) {
    return "low";
  }

  // Low device memory (Device Memory API, Chromium-only). Reported value is
  // coarse and capped at 8; 4GB or less reads as a weaker device.
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) {
    return "low";
  }

  // Few logical CPU cores (widely supported) → weaker device.
  if (
    typeof nav.hardwareConcurrency === "number" &&
    nav.hardwareConcurrency <= 4
  ) {
    return "low";
  }

  // Users who explicitly prefer reduced motion get the calm, static tier too.
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return "low";
    }
  } catch {
    /* matchMedia unavailable — ignore. */
  }

  return "high";
}

// React hook form. Returns "high" on the server and the first client paint to
// keep SSR markup stable, then settles to the real tier after hydration and
// re-evaluates when the connection or motion preference changes. Components
// that must avoid a one-frame downgrade flash should call detectDeviceTier()
// synchronously instead of using this hook.
export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>("high");

  useEffect(() => {
    const update = () => setTier(detectDeviceTier());
    update();

    const nav = navigator as NavigatorWithTier;
    const connection = nav.connection;
    connection?.addEventListener?.("change", update);

    let motionQuery: MediaQueryList | null = null;
    try {
      motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      motionQuery.addEventListener?.("change", update);
    } catch {
      /* matchMedia unavailable — ignore. */
    }

    return () => {
      connection?.removeEventListener?.("change", update);
      motionQuery?.removeEventListener?.("change", update);
    };
  }, []);

  return tier;
}
