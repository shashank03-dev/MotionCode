"use client";

import { LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  className?: string;
  label?: string;
  /** When true (default) clicking opens a confirm dialog before signing out. */
  confirm?: boolean;
};

export function SignOutButton({
  className,
  label = "Sign out",
  confirm = true,
}: SignOutButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const submit = () => formRef.current?.requestSubmit();

  return (
    <form ref={formRef} action="/auth/signout" method="post">
      <button
        type={confirm ? "button" : "submit"}
        onClick={confirm ? () => setConfirming(true) : undefined}
        className={cn(
          "inline-flex h-11 min-h-[44px] items-center justify-center gap-2 border px-3 text-sm transition",
          className,
        )}
      >
        <LogOut className="size-4" aria-hidden="true" />
        {label}
      </button>

      {confirm ? (
        <SignOutConfirmDialog
          open={confirming}
          onCancel={() => setConfirming(false)}
          onConfirm={submit}
        />
      ) : null}
    </form>
  );
}

function SignOutConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
        return;
      }
      if (event.key === "Tab") {
        const container = dialogRef.current;
        if (!container) return;
        const focusables = Array.from(
          container.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
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
    const focusTimer = window.setTimeout(() => confirmRef.current?.focus(), 60);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      previouslyFocused?.focus?.();
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
      <button
        type="button"
        aria-label="Cancel sign out"
        onClick={onCancel}
        tabIndex={-1}
        className="absolute inset-0 cursor-default bg-black/72 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="signout-title"
        aria-describedby="signout-body"
        tabIndex={-1}
        className="glass-card relative z-10 my-auto max-h-[90dvh] w-full max-w-[400px] overflow-y-auto rounded-2xl p-6"
      >
        <div className="flex items-start gap-3.5">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-9 flex-none items-center justify-center rounded-lg border border-accent-border bg-accent-dim text-accent"
          >
            <LogOut size={18} />
          </span>
          <div className="min-w-0">
            <h2
              id="signout-title"
              className="font-display text-[1.05rem] font-medium leading-snug text-ink"
            >
              Sign out of MotionCode?
            </h2>
            <p
              id="signout-body"
              className="mt-2 font-sans text-[0.86rem] leading-relaxed text-ink-2"
            >
              You&apos;ll need to sign in again to get back to your workspace.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-hairline px-4 py-2 min-h-[44px] font-mono text-[0.74rem] uppercase tracking-[0.12em] text-ink-2 transition-colors hover:border-accent-border hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-accent px-4 py-2 min-h-[44px] font-mono text-[0.74rem] font-medium uppercase tracking-[0.12em] text-black shadow-glow transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text)]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
