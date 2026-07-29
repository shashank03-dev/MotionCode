import {
  Skeleton,
  SkeletonPage,
  SkeletonPageHeader,
} from "@/components/ui/skeleton";

// Shown instantly while the dynamic dashboard server component fetches its data
// (profile, workspaces, projects, usage). Replaces the blank wait on navigation
// with a structural skeleton so the page feels responsive on slow connections.
export default function DashboardLoading() {
  return (
    <SkeletonPage label="Loading dashboard">
      <div className="space-y-8">
        <SkeletonPageHeader />

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} aria-hidden className="rounded-xl bg-panel p-5 shadow-ring">
              <Skeleton shape="text" className="h-2.5 w-20" />
              <Skeleton shape="text" className="mt-3 h-8 w-16" />
            </div>
          ))}
        </div>

        <Skeleton shape="block" className="h-11 w-full max-w-md" />

        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="flex items-center gap-4 rounded-xl bg-panel p-4 shadow-ring"
            >
              <Skeleton shape="block" className="size-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton shape="text" className="h-3.5 w-1/3" />
                <Skeleton shape="text" className="mt-2 h-3 w-1/5" />
              </div>
              <Skeleton shape="pill" className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
