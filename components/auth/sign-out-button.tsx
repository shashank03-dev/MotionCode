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
          "inline-flex h-9 items-center justify-center gap-2 border px-3 text-sm transition",
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

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => confirmRef.current?.focus(), 60);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [open, onCancel]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Cancel sign out"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-black/72 backdrop-blur-sm"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="signout-title"
        aria-describedby="signout-body"
        className="relative z-10 w-full max-w-[400px] rounded-2xl border border-[var(--border)] bg-[#0d0f0b] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-start gap-3.5">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-9 flex-none items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--accent)]"
          >
            <LogOut size={18} />
          </span>
          <div className="min-w-0">
            <h2
              id="signout-title"
              className="text-[0.98rem] font-semibold leading-snug text-[var(--text)]"
            >
              Sign out of MotionCode?
            </h2>
            <p
              id="signout-body"
              className="mt-2 font-sans text-[0.84rem] leading-relaxed text-[var(--accent)]"
            >
              You&apos;ll need to sign in again to get back to your workspace.
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--border)] px-3.5 py-2 font-mono text-[0.74rem] text-[var(--accent)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-3.5 py-2 font-mono text-[0.74rem] font-medium text-[#11120d] transition-colors hover:bg-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text)]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
