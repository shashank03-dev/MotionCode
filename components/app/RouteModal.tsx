"use client";

import { ArrowLeft, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
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
  const dialogRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace("/app");
    }
  }, [router]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dismiss();
        return;
      }
      if (event.key === "Tab") {
        const container = dialogRef.current;
        if (!container) return;
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.getClientRects().length > 0);
        if (focusables.length === 0) {
          event.preventDefault();
          container.focus();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      const container = dialogRef.current;
      const first = container?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (first ?? container)?.focus();
    }, 60);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      previouslyFocused?.focus?.();
    };
  }, [router, dismiss]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-start justify-center overflow-y-auto p-4 sm:p-6 lg:p-10">
      <button
        type="button"
        aria-label={`Close ${title}`}
        onClick={dismiss}
        tabIndex={-1}
        className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-md"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="glass-card relative z-10 my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl sm:max-h-[calc(100dvh-3rem)] lg:max-h-[calc(100dvh-5rem)]"
      >
        <header className="flex shrink-0 items-center gap-3 rounded-t-3xl border-b border-hairline bg-panel/85 px-5 py-3.5 backdrop-blur-xl">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Back"
            className="flex size-11 sm:size-8 items-center justify-center rounded-lg border border-transparent text-ink-3 transition hover:border-hairline hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </button>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-2">
            {title}
          </h2>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="ml-auto flex size-11 sm:size-8 items-center justify-center rounded-lg border border-transparent text-ink-3 transition hover:border-hairline hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
