import { Skeleton } from "@/components/ui/skeleton";

/**
 * Root-segment fallback. Mirrors the landing hero: nav pill, eyebrow, the
 * two-line display headline, CTA, and the artifact panel on the right.
 *
 * Distinct from the landing preloader (components/site/preloader.tsx): the
 * preloader is the branded first-visit moment, while this covers server work on
 * any root-segment route that has no closer boundary.
 */
export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Loading MotionCode"
      className="min-h-screen bg-canvas px-4 py-16 text-ink sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-7xl">
        <Skeleton shape="pill" className="h-10 w-44" />

        <div className="mt-16 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Skeleton shape="pill" className="h-3 w-52" />
            <Skeleton shape="text" className="mt-6 h-16 w-full max-w-2xl" />
            <Skeleton shape="text" className="mt-4 h-16 w-3/4" />
            <Skeleton shape="pill" className="mt-8 h-11 w-36" />
          </div>
          <Skeleton shape="block" className="h-96 rounded-2xl" />
        </div>
      </div>
    </main>
  );
}
