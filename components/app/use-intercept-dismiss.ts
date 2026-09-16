"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

/**
 * Dismiss helper for intercepting `@modal` routes. Calls router.back() to
 * unwind the intercepted navigation, with a mounted-guarded router.replace
 * fallback in case back() leaves the modal mounted (e.g. direct entry edge
 * cases). The fallback timer is cleared on unmount to avoid leaks.
 */
export function useInterceptDismiss(
  fallbackPath = "/app",
  delayMs = 300,
): () => void {
  const router = useRouter();
  const mountedRef = useRef(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        if (mountedRef.current) {
          router.replace(fallbackPath);
        }
      }, delayMs);
    } else {
      router.replace(fallbackPath);
    }
  }, [router, fallbackPath, delayMs]);

  return dismiss;
}
