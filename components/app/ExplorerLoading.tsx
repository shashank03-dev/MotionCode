export function ExplorerLoading() {
  return (
    <div
      className="flex h-full min-h-0 flex-col"
      role="status"
      aria-label="Loading explorer"
    >
      <div className="flex h-9 shrink-0 items-center justify-between px-3">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
          Explorer
        </span>
        <span className="size-6 border border-hairline bg-panel" aria-hidden="true" />
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-hidden px-3 pt-2">
        <span className="block h-8 w-full animate-pulse bg-white/[0.04]" />
        <span className="block h-8 w-5/6 animate-pulse bg-white/[0.04]" />
        <span className="block h-8 w-full animate-pulse bg-white/[0.04]" />
      </div>
    </div>
  );
}
