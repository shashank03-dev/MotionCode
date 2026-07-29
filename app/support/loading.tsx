import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

/**
 * `/support` awaits the Supabase user and then their account-scoped ticket
 * history. Mirrors the marketing hero followed by the ticket composer and list.
 */
export default function SupportLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading support"
      className="min-h-screen bg-canvas text-ink"
    >
      <div className="container-page py-14">
        <div className="max-w-2xl">
          <Skeleton shape="pill" className="h-2.5 w-24 opacity-70" />
          <Skeleton shape="text" className="mt-5 h-10 w-full max-w-sm" />
          <Skeleton shape="text" className="mt-4 h-4 w-full max-w-lg" />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <SkeletonCard>
            <Skeleton shape="text" className="h-3.5 w-28" />
            <div className="mt-5 space-y-4">
              <div className="grid gap-1.5">
                <Skeleton shape="text" className="h-3 w-16" />
                <Skeleton shape="block" className="h-10 w-full" />
              </div>
              <div className="grid gap-1.5">
                <Skeleton shape="text" className="h-3 w-20" />
                <Skeleton shape="block" className="h-24 w-full" />
              </div>
              <Skeleton shape="block" className="h-10 w-32" />
            </div>
          </SkeletonCard>

          <div className="space-y-3">
            <Skeleton shape="text" className="h-3 w-32" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                aria-hidden
                className="rounded-xl bg-panel p-4 shadow-ring"
              >
                <div className="flex items-center justify-between gap-3">
                  <Skeleton shape="text" className="h-3.5 w-40" />
                  <Skeleton shape="pill" className="h-6 w-16" />
                </div>
                <Skeleton shape="text" className="mt-3 h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
