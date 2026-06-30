"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type FreeSaveNoticeModalProps = {
  open: boolean;
  /** Called when the user backs out — the pending upload is discarded. */
  onCancel: () => void;
  /** Called when the user acknowledges. `dontRemind` persists the opt-out. */
  onConfirm: (dontRemind: boolean) => void;
};

export function FreeSaveNoticeModal({
  open,
  onCancel,
  onConfirm,
}: FreeSaveNoticeModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [dontRemind, setDontRemind] = useState(false);

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
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Cancel upload"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-black/72 backdrop-blur-sm"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="free-save-title"
        aria-describedby="free-save-body"
        className="relative z-10 w-full max-w-[420px] rounded-2xl border border-[var(--border)] bg-[#0d0f0b] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-start gap-3.5">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-9 flex-none items-center justify-center rounded-lg border border-[#f4a340]/35 bg-[#f4a340]/10 text-[#f4a340]"
          >
            <TriangleAlert size={18} />
          </span>
          <div className="min-w-0">
            <h2
              id="free-save-title"
              className="text-[0.98rem] font-semibold leading-snug text-[var(--text)]"
            >
              Your work won&apos;t be saved
            </h2>
            <p
              id="free-save-body"
              className="mt-2 text-[0.84rem] leading-relaxed text-[var(--accent)]"
            >
              On the Free plan, this analysis lives only in this tab. Copy the
              CSS, GSAP, or Framer Motion code you need before you close or leave
              the app — once you go, it&apos;s gone.{" "}
              <Link
                href="/pricing"
                className="whitespace-nowrap text-[var(--text)] underline decoration-[var(--border)] underline-offset-2 transition-colors hover:decoration-[var(--accent)]"
              >
                Upgrade to save projects
              </Link>
              .
            </p>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer select-none items-center gap-2.5 text-[0.78rem] text-[var(--accent)]">
          <input
            type="checkbox"
            checked={dontRemind}
            onChange={(event) => setDontRemind(event.target.checked)}
            className="size-3.5 accent-[var(--accent)]"
          />
          Don&apos;t remind me again
        </label>

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
            onClick={() => onConfirm(dontRemind)}
            className="rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-3.5 py-2 font-mono text-[0.74rem] font-medium text-[#11120d] transition-colors hover:bg-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text)]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
