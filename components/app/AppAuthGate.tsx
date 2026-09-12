"use client";

import { useEffect } from "react";

import { LoginForm } from "@/components/dashboard/login-form";
import { Logo } from "@/components/site/logo";

/**
 * Non-dismissible sign-in gate shown over a blurred /app for anonymous
 * visitors. The analyzer is a signed-in surface now — you must authenticate
 * before you can use it. The underlying app is rendered `inert` behind this
 * overlay, so it reads as "the app, locked" rather than a separate page.
 *
 * There is intentionally no close affordance: no backdrop dismissal, no Escape.
 * Successful sign-in (password / magic link / Google) navigates to `/app` via
 * the LoginForm's own redirect, reloading the page as an authenticated user.
 */
export function AppAuthGate() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/70 backdrop-blur-xl"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-auth-title"
        className="glass-card relative z-10 my-auto w-full max-w-md rounded-3xl p-6 sm:p-8"
      >
        <div className="flex items-center justify-between">
          <Logo />
          <span className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
            Sign in
          </span>
        </div>

        <h1
          id="app-auth-title"
          className="mt-6 font-display text-2xl font-medium leading-[1.1] tracking-tightest text-ink"
        >
          Sign in to start analyzing motion.
        </h1>
        <p className="mt-2.5 text-[14.5px] leading-6 text-ink-2 text-pretty">
          MotionCode turns motion references into a spec and production code.
          Create a free account or sign in to open the analyzer.
        </p>

        <div className="mt-7">
          <LoginForm nextPath="/app" />
        </div>
      </div>
    </div>
  );
}
