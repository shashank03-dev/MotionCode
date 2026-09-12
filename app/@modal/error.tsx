"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

type ModalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Error boundary for the `@modal` parallel slot (Account / Billing
 * intercepting routes). Scoped to the overlay so a modal failure never takes
 * down the underlying page - dismiss returns to it via router.back().
 */
export default function ModalError({ error, reset }: ModalErrorProps) {
  const router = useRouter();

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/app");
    }
  }, [router]);

  useEffect(() => {
    console.error("[modal] dialog failed", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismiss]);

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={dismiss}
        tabIndex={-1}
        className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-md"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Dialog could not load"
        className="glass-card relative z-10 w-full max-w-sm rounded-2xl p-6 text-center"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-3">
          Dialog error
        </p>
        <h2 className="mt-2 font-display text-xl tracking-tight">
          This dialog could not load.
        </h2>
        {error.digest ? (
          <p className="mt-2 font-mono text-[11px] text-ink-3">
            Reference: {error.digest}
          </p>
        ) : null}
        <div className="mt-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center rounded-full bg-accent px-5 text-sm font-medium text-black transition hover:brightness-110 active:scale-[0.98]"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-11 items-center rounded-full px-5 text-sm font-medium text-ink transition hover:bg-white/[0.04]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
