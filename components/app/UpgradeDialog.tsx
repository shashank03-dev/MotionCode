"use client";

import { ArrowUpRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
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
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dismiss upgrade prompt"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-black/70 backdrop-blur-md"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Upgrade to unlock ${feature}`}
        className="glass-card relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-7"
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

        <div className="mt-7 flex items-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-accent-border bg-accent px-5 text-sm font-medium text-black shadow-glow transition hover:brightness-110 active:scale-[0.98]"
          >
            View plans
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-hairline px-4 text-sm font-medium text-ink-2 transition hover:border-accent-border hover:text-ink"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
