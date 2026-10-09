import { ArrowLeft } from "lucide-react";

import { ExposureRule } from "@/components/chrono/page-hero";
import { SiteFooter, SiteHeader } from "@/components/marketing";
import { ButtonLink } from "@/components/ui/site-button";

export default function NotFound() {
  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <SiteHeader />
      <main className="container-page flex min-h-[72vh] flex-col justify-center py-20 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">
          404 · frame not found
        </p>
        <h1 className="mx-auto mt-6 max-w-[14ch] text-[clamp(2.6rem,7vw,6rem)] font-medium leading-[0.95] tracking-[-0.05em]">
          This page is <span className="serif-em">not available.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-2">
          The route may have moved, or it may not exist in this build of
          MotionCode.
        </p>
        <ExposureRule className="mx-auto mt-12 w-full max-w-sm" />
        <div className="mt-12 flex justify-center">
          <ButtonLink href="/" variant="primary" size="lg">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back home
          </ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
