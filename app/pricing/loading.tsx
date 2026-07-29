import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

/**
 * `/pricing` is force-dynamic (it resolves the signed-in user's plan to pick
 * the right CTA per tier), so it always has a server round-trip. This mirrors
 * the three-column plan grid underneath the marketing header.
 */
export default function PricingLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Loading pricing"
      className="min-h-screen bg-canvas px-4 py-16 text-ink sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <Skeleton shape="pill" className="mx-auto h-2.5 w-28 opacity-70" />
          <Skeleton shape="text" className="mx-auto mt-5 h-11 w-full max-w-md" />
          <Skeleton shape="text" className="mx-auto mt-4 h-4 w-3/4 max-w-sm" />
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="rounded-2xl bg-panel p-6 shadow-ring sm:p-8"
            >
              <Skeleton shape="text" className="h-3.5 w-20" />
              <Skeleton shape="text" className="mt-5 h-10 w-32" />
              <Skeleton shape="text" className="mt-3 h-3.5 w-full" />

              <Skeleton shape="block" className="mt-7 h-11 w-full" />

              <div className="mt-8 space-y-3">
                {Array.from({ length: 5 }).map((_, row) => (
                  <div key={row} className="flex items-center gap-3">
                    <Skeleton shape="circle" className="size-4 shrink-0" />
                    <Skeleton shape="text" className="h-3 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <SkeletonText lines={2} className="mx-auto mt-14 max-w-xl" />
      </div>
    </main>
  );
}
