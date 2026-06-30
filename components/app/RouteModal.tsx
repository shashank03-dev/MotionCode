"use client";

import { ArrowLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type RouteModalProps = {
  /** Shown in the modal header bar and used as the dialog's accessible name. */
  title: string;
  children: ReactNode;
};

/**
 * Centered modal used by the intercepting `@modal` routes (Account / Billing).
 * Dismissing — backdrop click, the ✕/back buttons, or Escape — calls
 * router.back(), which unwinds the intercepted navigation and returns to the
 * underlying app page. A hard load of /account or /billing skips interception
 * and renders the full standalone page instead.
 */
export function RouteModal({ title, children }: RouteModalProps) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") router.back();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [router]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto p-4 sm:p-6 lg:p-10">
      <button
        type="button"
        aria-label={`Close ${title}`}
        onClick={() => router.back()}
        className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-md"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 my-auto w-full max-w-4xl rounded-2xl border border-[var(--border)] bg-[#0d0f0b] shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
      >
        <header className="sticky top-0 z-10 flex items-center gap-3 rounded-t-2xl border-b border-[var(--border)] bg-[#0d0f0b]/95 px-5 py-3.5 backdrop-blur">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="flex size-8 items-center justify-center rounded-md border border-transparent text-[var(--accent)] transition hover:border-[var(--border)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <h2 className="font-mono text-sm uppercase tracking-[0.18em] text-[var(--text)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Close"
            className="ml-auto flex size-8 items-center justify-center rounded-md border border-transparent text-[var(--accent)] transition hover:border-[var(--border)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>
        <div className="px-5 py-6 sm:px-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
