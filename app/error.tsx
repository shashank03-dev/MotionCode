"use client";

import Link from "next/link";
import { RefreshCcw } from "lucide-react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-16 text-ink">
      <section className="glass-card w-full max-w-2xl rounded-2xl p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[var(--danger)]/10 text-[var(--danger)]">
          <RefreshCcw className="size-6" aria-hidden="true" />
        </div>
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-3">
          Error
        </p>
        <h1 className="mt-3 font-display text-3xl leading-tight tracking-tight">
          MotionCode could not load this page.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-2">
          Try loading the route again. If it keeps failing, use the support page
          checklist and include the route where this happened.
        </p>
        {process.env.NODE_ENV !== "production" ? (
          <p className="mt-4 rounded-xl bg-black/40 p-3 font-mono text-xs text-[var(--danger)]">
            {error.message}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-black shadow-glow transition hover:brightness-110 active:scale-[0.98]"
          >
            Try again
          </button>
          <Link
            href="/support"
            className="inline-flex h-11 items-center rounded-full px-5 text-sm font-medium text-ink shadow-ring transition hover:bg-white/[0.04]"
          >
            Support
          </Link>
        </div>
      </section>
    </main>
  );
}
