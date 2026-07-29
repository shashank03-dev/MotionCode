import {
  Skeleton,
  SkeletonCard,
  SkeletonPageHeader,
} from "@/components/ui/skeleton";

/**
 * `/billing` awaits the user, entitlement summary, Razorpay invoices, and any
 * scheduled plan change — the slowest authed page in the app, so the skeleton
 * matters most here. Mirrors PageHeader → plan panel → invoice rows.
 */
export default function BillingLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Loading billing"
      className="relative min-h-screen bg-canvas px-4 py-10 text-ink sm:px-6 lg:px-8"
    >
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col gap-9">
        <SkeletonPageHeader actions={1} />

        <SkeletonCard>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-48 flex-1">
              <Skeleton shape="text" className="h-3 w-24" />
              <Skeleton shape="text" className="mt-3 h-8 w-40" />
              <Skeleton shape="text" className="mt-3 h-3.5 w-full max-w-sm" />
            </div>
            <Skeleton shape="pill" className="h-7 w-24" />
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Skeleton shape="block" className="h-10 w-36" />
            <Skeleton shape="block" className="h-10 w-28" />
          </div>
        </SkeletonCard>

        <div>
          <Skeleton shape="text" className="h-3 w-32" />
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                aria-hidden
                className="flex items-center justify-between gap-4 rounded-xl bg-panel p-4 shadow-ring"
              >
                <Skeleton shape="text" className="h-3.5 w-32" />
                <Skeleton shape="text" className="h-3.5 w-20" />
                <Skeleton shape="pill" className="h-6 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
