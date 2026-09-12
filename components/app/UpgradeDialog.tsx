"use client";

import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

type UpgradeDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Headline feature, e.g. "workspaces". */
  feature?: string;
  /** Message surfaced from the API (falls back to a default). */
  message?: string | null;
};

const BENEFITS = [
  "Create workspaces to organize your motion work",
  "Save analyses as versioned projects",
  "Share links & invite your team",
] as const;

/**
 * Lightweight upgrade prompt shown when a free-tier action is blocked by plan
 * quota (e.g. creating a workspace returns BILLING_REQUIRED). Self-contained,
 * portalled, and dismissible — the underlying form keeps its typed input so the
 * user can act again immediately after upgrading.
 */
export function UpgradeDialog({
  open,
  onClose,
  feature = "workspaces",
  message,
}: UpgradeDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      // Tab trap: keep focus cycling inside the dialog.
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
      // Return focus to whatever opened the dialog.
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-start justify-center overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <button
        type="button"
        aria-label="Dismiss upgrade prompt"
        onClick={onClose}
        tabIndex={-1}
        className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-md"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Upgrade to unlock ${feature}`}
        tabIndex={-1}
        className="glass-card relative z-10 my-auto max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl p-6 sm:p-7"
      >
        <span className="accent-underglow inline-flex size-11 items-center justify-center rounded-2xl border border-accent-border bg-accent-dim text-accent shadow-glow">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>

        <h2 className="mt-5 font-display text-2xl font-medium leading-[1.1] tracking-tightest text-ink">
          Upgrade to create {feature}.
        </h2>
        <p className="mt-2.5 text-[14.5px] leading-6 text-ink-2 text-pretty">
          {message ??
            "Workspaces are a paid feature. Keep analyzing motion for free, or upgrade to organize and save your work."}
        </p>

        <ul className="mt-5 grid gap-2.5 text-left">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit}
              className="flex items-center gap-2.5 text-[13.5px] text-ink-2"
            >
              <Check className="size-4 shrink-0 text-accent" aria-hidden="true" />
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/pricing"
            className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-accent-border bg-accent px-5 text-sm font-medium text-black shadow-glow transition hover:brightness-110 active:scale-[0.98] sm:w-auto sm:flex-1"
          >
            View plans
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 min-h-[44px] w-full items-center justify-center rounded-lg border border-hairline px-4 text-sm font-medium text-ink-2 transition hover:border-accent-border hover:text-ink sm:w-auto"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
