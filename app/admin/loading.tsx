import { Skeleton } from "@/components/ui/skeleton";

/**
 * `/admin` resolves the internal-admin context and then the support dashboard
 * aggregate. Mirrors the stat row above the ticket queue.
 */
export default function AdminLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Loading admin dashboard"
      className="min-h-screen bg-canvas px-4 py-10 text-ink sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="border-b border-hairline pb-6">
          <Skeleton shape="pill" className="h-2.5 w-20 opacity-70" />
          <Skeleton shape="text" className="mt-4 h-9 w-64" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} aria-hidden className="rounded-xl bg-panel p-5 shadow-ring">
              <Skeleton shape="text" className="h-2.5 w-20" />
              <Skeleton shape="text" className="mt-3 h-8 w-16" />
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <Skeleton shape="text" className="h-3 w-32" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="flex items-center justify-between gap-4 rounded-xl bg-panel p-4 shadow-ring"
            >
              <Skeleton shape="text" className="h-3.5 w-1/3" />
              <Skeleton shape="text" className="h-3 w-24" />
              <Skeleton shape="pill" className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
