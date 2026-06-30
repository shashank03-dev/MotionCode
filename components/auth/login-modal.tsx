"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { LoginExperience } from "@/components/auth/login-experience";
import { DEFAULT_AUTH_NEXT_PATH } from "@/lib/auth/redirects";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  nextPath?: string;
};

export function LoginModal({
  open,
  onClose,
  nextPath = DEFAULT_AUTH_NEXT_PATH,
}: LoginModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      dialogRef.current
        ?.querySelector<HTMLElement>("input, button, a[href]")
        ?.focus();
    }, 60);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close sign in"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/72 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="login-dialog relative z-10 w-full max-w-[940px]"
      >
        <LoginExperience nextPath={nextPath} onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}
