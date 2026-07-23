import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/marketing";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SiteHeader />
      <main className="container-page flex min-h-[70vh] flex-col justify-center py-16 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent-dim text-accent shadow-ring">
          <SearchX className="size-7" aria-hidden="true" />
        </div>
        <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-3">
          404
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight tracking-tight sm:text-6xl">
          This page is not available.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-ink-2">
          The route may have moved, or it may not exist in this build of
          MotionCode.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-black shadow-glow transition hover:brightness-110 active:scale-[0.98]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
