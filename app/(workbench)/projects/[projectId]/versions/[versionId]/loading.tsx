import { Skeleton } from "@/components/ui/skeleton";

/**
 * A specific saved version. Same shape as the project page (header + timeline
 * rail + viewer) since it renders the same components with one version pinned.
 */
export default function VersionLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading version"
      className="mx-auto max-w-6xl space-y-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-7">
        <div className="min-w-56 flex-1">
          <Skeleton shape="pill" className="h-2.5 w-28 opacity-70" />
          <Skeleton shape="text" className="mt-4 h-9 w-full max-w-sm" />
        </div>
        <Skeleton shape="pill" className="h-7 w-24" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-2.5">
          <Skeleton shape="text" className="h-3 w-24" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="rounded-xl bg-panel p-3.5 shadow-ring"
            >
              <Skeleton shape="text" className="h-3.5 w-2/3" />
              <Skeleton shape="text" className="mt-2 h-2.5 w-1/3" />
            </div>
          ))}
        </div>

        <div aria-hidden className="rounded-2xl bg-panel p-5 shadow-ring sm:p-6">
          <Skeleton shape="block" className="h-56 w-full" />
          <div className="mt-5 space-y-2.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                shape="text"
                className={`h-3 ${i % 3 === 2 ? "w-2/5" : "w-full"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
