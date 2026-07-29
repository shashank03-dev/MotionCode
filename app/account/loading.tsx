import {
  Skeleton,
  SkeletonPage,
  SkeletonPageHeader,
} from "@/components/ui/skeleton";

// Shown instantly while the dynamic account server component resolves the
// authenticated user and entitlement summary, so navigation to /account never
// flashes a blank screen on slower connections.
export default function AccountLoading() {
  return (
    <SkeletonPage label="Loading account" className="py-8">
      <div className="flex flex-col gap-8">
        <SkeletonPageHeader actions={3} />

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} aria-hidden className="rounded-xl bg-panel p-5 shadow-ring">
              <Skeleton shape="text" className="h-2.5 w-24" />
              <Skeleton shape="text" className="mt-3 h-7 w-20" />
              <Skeleton shape="text" className="mt-3 h-3 w-full" />
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="flex items-center justify-between gap-4 rounded-xl bg-panel p-4 shadow-ring"
            >
              <Skeleton shape="text" className="h-3.5 w-40" />
              <Skeleton shape="text" className="h-3.5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
