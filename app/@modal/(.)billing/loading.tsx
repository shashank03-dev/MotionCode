import { RouteModal } from "@/components/app/RouteModal";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * `BillingContent` awaits the user, entitlements, Razorpay invoices, and any
 * scheduled plan change — the longest wait behind any modal in the app. The
 * dialog frame stays interactive while the body fills in.
 */
export default function BillingModalLoading() {
  return (
    <RouteModal title="Billing">
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading billing"
        className="space-y-7 p-5 sm:p-7"
      >
        <div aria-hidden className="rounded-2xl bg-panel p-5 shadow-ring sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-48 flex-1">
              <Skeleton shape="text" className="h-3 w-24" />
              <Skeleton shape="text" className="mt-3 h-8 w-36" />
            </div>
            <Skeleton shape="pill" className="h-7 w-24" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Skeleton shape="block" className="h-10 w-36" />
            <Skeleton shape="block" className="h-10 w-28" />
          </div>
        </div>

        <div className="space-y-2.5">
          <Skeleton shape="text" className="h-3 w-28" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              aria-hidden
              className="flex items-center justify-between gap-4 rounded-xl bg-panel p-4 shadow-ring"
            >
              <Skeleton shape="text" className="h-3.5 w-32" />
              <Skeleton shape="text" className="h-3.5 w-20" />
              <Skeleton shape="pill" className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    </RouteModal>
  );
}
