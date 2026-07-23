// Shown instantly while the dynamic dashboard server component fetches its data
// (profile, workspaces, projects, usage). Replaces the blank wait on navigation
// with a structural skeleton so the page feels responsive on slow connections.
export default function DashboardLoading() {
  return (
    <main
      aria-label="Loading dashboard"
      className="min-h-screen bg-canvas px-4 py-10 text-ink sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="space-y-4 border-b border-hairline pb-6">
          <div className="h-3 w-40 animate-pulse rounded-[6px] bg-white/10" />
          <div className="h-10 w-full max-w-2xl animate-pulse rounded-[8px] bg-white/10" />
          <div className="h-4 w-3/4 max-w-xl animate-pulse rounded-[6px] bg-white/10" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-[8px] border border-hairline bg-white/10"
            />
          ))}
        </div>

        <div className="h-11 w-full max-w-md animate-pulse rounded-[8px] bg-white/10" />

        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-[8px] border border-hairline bg-white/10"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
