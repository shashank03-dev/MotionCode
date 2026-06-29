// Shown instantly while the dynamic account server component resolves the
// authenticated user and entitlement summary, so navigation to /account never
// flashes a blank screen on slower connections.
export default function AccountLoading() {
  return (
    <main
      aria-label="Loading account"
      className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <div className="h-3 w-28 animate-pulse rounded-[6px] bg-[#9ef0c0]/20" />
            <div className="h-9 w-44 animate-pulse rounded-[8px] bg-white/10" />
          </div>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-28 animate-pulse rounded-[8px] bg-white/10"
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-[8px] border border-[var(--border)] bg-white/5"
            />
          ))}
        </div>

        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-[8px] border border-[var(--border)] bg-white/5"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
