"use client";

import Link from "next/link";
import { RefreshCcw } from "lucide-react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#10120d] px-4 py-16 text-[#fffbf4]">
      <section className="w-full max-w-2xl rounded-[8px] border border-white/10 bg-[#151811] p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-[8px] bg-[#f58f7c]/10 text-[#f58f7c]">
          <RefreshCcw className="size-6" aria-hidden="true" />
        </div>
        <p className="mt-6 font-mono text-xs uppercase tracking-[0.22em] text-[#ffd166]">
          Error
        </p>
        <h1 className="mt-3 font-mono text-3xl leading-tight">
          MotionCode could not load this page.
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#d8cfbc]/75">
          Try loading the route again. If it keeps failing, use the support page
          checklist and include the route where this happened.
        </p>
        {process.env.NODE_ENV !== "production" ? (
          <p className="mt-4 rounded-[8px] bg-[#0d100b] p-3 font-mono text-xs text-[#f58f7c]">
            {error.message}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center rounded-[8px] bg-[#9ef0c0] px-4 text-sm font-semibold text-[#10120d] hover:bg-[#c8ffd9]"
          >
            Try again
          </button>
          <Link
            href="/support"
            className="inline-flex h-10 items-center rounded-[8px] border border-white/15 px-4 text-sm font-semibold text-[#fffbf4] hover:border-[#9ef0c0]/50"
          >
            Support
          </Link>
        </div>
      </section>
    </main>
  );
}
