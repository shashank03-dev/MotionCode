import { Skeleton } from "@/components/ui/skeleton";

/**
 * The analyzer. Renders inside the persistent Workbench shell from the
 * (workbench) layout, so this covers only the inner content area — no page
 * chrome, no canvas background.
 *
 * Mirrors the analyze workspace: upload dropzone on the left, spec/output
 * column on the right.
 */
export default function AnalyzeLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading analyzer"
      className="mx-auto w-full max-w-6xl p-4 sm:p-6"
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <Skeleton
            shape="block"
            className="h-64 rounded-2xl border border-dashed border-hairline"
          />
          <div className="flex flex-wrap gap-2.5">
            <Skeleton shape="block" className="h-10 w-32" />
            <Skeleton shape="block" className="h-10 w-24" />
          </div>
          <div aria-hidden className="rounded-2xl bg-panel p-5 shadow-ring">
            <Skeleton shape="text" className="h-3 w-24" />
            <div className="mt-4 flex gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} shape="block" className="h-14 flex-1" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div aria-hidden className="rounded-2xl bg-panel p-5 shadow-ring">
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} shape="block" className="h-8 w-24" />
              ))}
            </div>
            <div className="mt-5 space-y-2.5">
              {Array.from({ length: 10 }).map((_, i) => (
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
    </div>
  );
}
