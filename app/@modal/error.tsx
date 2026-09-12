"use client";

import Link from "next/link";
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
    <div className="fixed inset-0 z-[140] flex items-center justify-center overflow-y-auto p-4">
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
        aria-labelledby="modal-error-title"
        aria-describedby="modal-error-body"
        className="glass-card relative z-10 my-auto max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl p-6 text-center"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-3">
          Dialog error
        </p>
        <h2
          id="modal-error-title"
          className="mt-2 font-display text-xl tracking-tight"
        >
          This dialog could not load.
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-2">
          Try loading the dialog again. If it keeps failing, use the support
          page checklist and include the route where this happened.
        </p>
        {error.digest ? (
          <p
            id="modal-error-body"
            className="mt-2 font-mono text-[11px] text-ink-3"
          >
            Reference: {error.digest}
          </p>
        ) : null}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center rounded-lg bg-accent px-5 text-sm font-medium text-black transition hover:brightness-110 active:scale-[0.98]"
          >
            Try again
          </button>
          <Link
            href="/support"
            className="inline-flex h-11 items-center rounded-lg px-5 text-sm font-medium text-ink transition hover:bg-white/[0.04]"
          >
            Support
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-11 items-center rounded-lg px-5 text-sm font-medium text-ink transition hover:bg-white/[0.04]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
