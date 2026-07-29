import { Skeleton, SkeletonPageHeader } from "@/components/ui/skeleton";

/**
 * The workspace desktop. Renders inside the Workbench shell, so this covers the
 * inner content area only. Mirrors PageHeader → create-workspace form → the
 * folder grid.
 */
export default function WorkspacesLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading workspaces"
      className="mx-auto max-w-6xl space-y-9"
    >
      <SkeletonPageHeader actions={1} />

      <Skeleton shape="block" className="h-24 w-full rounded-2xl" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} aria-hidden className="rounded-2xl bg-panel p-5 shadow-ring">
            <div className="flex items-center gap-3">
              <Skeleton shape="block" className="size-9 rounded-lg" />
              <Skeleton shape="text" className="h-4 w-28" />
            </div>
            <Skeleton shape="text" className="mt-4 h-3 w-full" />
            <Skeleton shape="text" className="mt-2.5 h-3 w-2/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
