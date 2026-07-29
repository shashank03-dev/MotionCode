import { Skeleton } from "@/components/ui/skeleton";

/**
 * `/admin/users` resolves the internal-admin context and then lists users with
 * their plan overrides. Mirrors the search control above the user table.
 */
export default function AdminUsersLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Loading admin users"
      className="min-h-screen bg-canvas px-4 py-10 text-ink sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="border-b border-hairline pb-6">
          <Skeleton shape="pill" className="h-2.5 w-20 opacity-70" />
          <Skeleton shape="text" className="mt-4 h-9 w-48" />
        </div>

        <Skeleton shape="block" className="h-10 w-full max-w-sm" />

        <div className="overflow-hidden rounded-2xl bg-panel shadow-ring">
          <div
            aria-hidden
            className="flex items-center gap-4 border-b border-hairline p-4"
          >
            <Skeleton shape="text" className="h-3 w-1/3" />
            <Skeleton shape="text" className="h-3 w-24" />
            <Skeleton shape="text" className="ml-auto h-3 w-20" />
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="flex items-center gap-4 border-b border-hairline p-4 last:border-b-0"
            >
              <Skeleton shape="text" className="h-3.5 w-1/3" />
              <Skeleton shape="pill" className="h-6 w-16" />
              <Skeleton shape="block" className="ml-auto h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
