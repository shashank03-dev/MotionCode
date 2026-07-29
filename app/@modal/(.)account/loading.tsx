import { RouteModal } from "@/components/app/RouteModal";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * `AccountContent` is an async server component (user + entitlement summary),
 * so the intercepted modal has a real wait. Reusing `RouteModal` means the
 * dialog frame — header, backdrop, Escape handling — is interactive
 * immediately and only the body fills in.
 */
export default function AccountModalLoading() {
  return (
    <RouteModal title="Account">
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading account"
        className="space-y-7 p-5 sm:p-7"
      >
        <div className="flex items-center gap-4">
          <Skeleton shape="circle" className="size-14" />
          <div className="min-w-0 flex-1">
            <Skeleton shape="text" className="h-4 w-40" />
            <Skeleton shape="text" className="mt-2.5 h-3 w-56" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} aria-hidden className="rounded-xl bg-panel p-5 shadow-ring">
              <Skeleton shape="text" className="h-2.5 w-20" />
              <Skeleton shape="text" className="mt-3 h-7 w-16" />
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} shape="block" className="h-12 w-full" />
          ))}
        </div>
      </div>
    </RouteModal>
  );
}
