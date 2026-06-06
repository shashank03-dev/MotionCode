import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/marketing";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#10120d] text-[#fffbf4]">
      <SiteHeader />
      <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-[8px] bg-[#f58f7c]/10 text-[#f58f7c]">
          <SearchX className="size-7" aria-hidden="true" />
        </div>
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.22em] text-[#ffd166]">
          404
        </p>
        <h1 className="mt-4 font-mono text-4xl leading-tight sm:text-6xl">
          This page is not available.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#d8cfbc]/75">
          The route may have moved, or it may not exist in this build of
          MotionCode.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#9ef0c0] px-5 text-sm font-semibold text-[#10120d] hover:bg-[#c8ffd9]"
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
