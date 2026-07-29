import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

/**
 * `/share/[token]` resolves the share token to a project server-side. This is
 * the only route in the app a logged-out stranger lands on cold, so the wait is
 * the first impression — mirrors the branded header, stat row, and viewer.
 */
export default function SharedProjectLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Loading shared analysis"
      className="relative min-h-screen bg-canvas px-4 py-10 text-ink sm:px-6 lg:px-8"
    >
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-6">
          <div className="flex items-center gap-2.5">
            <Skeleton shape="block" className="size-[22px] rounded-md" />
            <Skeleton shape="text" className="h-4 w-28" />
          </div>
          <Skeleton shape="pill" className="h-7 w-24" />
        </div>

        <div>
          <Skeleton shape="text" className="h-9 w-full max-w-md" />
          <Skeleton shape="text" className="mt-3.5 h-4 w-2/3 max-w-sm" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} aria-hidden className="rounded-xl bg-panel p-5 shadow-ring">
              <Skeleton shape="text" className="h-2.5 w-20" />
              <Skeleton shape="text" className="mt-3 h-8 w-24" />
            </div>
          ))}
        </div>

        <SkeletonCard className="min-h-80" lines={4} />
      </div>
    </main>
  );
}
