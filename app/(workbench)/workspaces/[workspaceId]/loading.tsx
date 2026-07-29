import { Skeleton } from "@/components/ui/skeleton";

/**
 * A single workspace: header, saved-analysis files, and the member list.
 * Renders inside the Workbench shell.
 */
export default function WorkspaceDetailLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading workspace"
      className="mx-auto max-w-6xl space-y-9"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline pb-7">
        <div className="min-w-56 flex-1">
          <Skeleton shape="pill" className="h-2.5 w-24 opacity-70" />
          <Skeleton shape="text" className="mt-4 h-9 w-full max-w-sm" />
          <Skeleton shape="text" className="mt-3.5 h-4 w-2/3 max-w-md" />
        </div>
        <div className="flex gap-2.5">
          <Skeleton shape="block" className="h-10 w-32" />
          <Skeleton shape="block" className="h-10 w-24" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <Skeleton shape="text" className="h-3 w-24" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="flex items-center gap-4 rounded-xl bg-panel p-4 shadow-ring"
            >
              <Skeleton shape="block" className="size-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton shape="text" className="h-3.5 w-1/2" />
                <Skeleton shape="text" className="mt-2 h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Skeleton shape="text" className="h-3 w-20" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="flex items-center gap-3 rounded-xl bg-panel p-4 shadow-ring"
            >
              <Skeleton shape="circle" className="size-8" />
              <Skeleton shape="text" className="h-3.5 flex-1" />
              <Skeleton shape="pill" className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
