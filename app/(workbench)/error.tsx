"use client";

import { RefreshCcw } from "lucide-react";

type WorkbenchErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WorkbenchError({ error, reset }: WorkbenchErrorProps) {
  return (
    <div
      className="flex items-center justify-center px-4 py-10"
      role="alert"
    >
      <section className="glass-card w-full max-w-md rounded-2xl p-6 text-center">
        <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-[var(--danger)]/10 text-[var(--danger)]">
          <RefreshCcw className="size-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-display text-xl leading-tight tracking-tight">
          This section could not load.
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-2">
          The explorer hit an error. Try again without reloading the whole
          page.
        </p>
        {process.env.NODE_ENV !== "production" ? (
          <p className="mt-3 truncate rounded-xl bg-black/40 p-3 font-mono text-xs text-[var(--danger)]">
            {error.message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-black shadow-glow transition hover:brightness-110 active:scale-[0.98]"
        >
          Try again
        </button>
      </section>
    </div>
  );
}
