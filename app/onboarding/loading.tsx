import { Skeleton } from "@/components/ui/skeleton";

/**
 * `/onboarding` awaits the dashboard user and entitlement summary before it can
 * render the workspace-creation panel. Mirrors the single centered glass panel.
 */
export default function OnboardingLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Loading onboarding"
      className="min-h-screen bg-canvas px-4 text-ink sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-2xl py-10">
        <div aria-hidden className="glass-card rounded-3xl p-6 sm:p-8">
          <Skeleton shape="pill" className="h-2.5 w-28 opacity-70" />
          <Skeleton shape="text" className="mt-4 h-9 w-full max-w-sm" />
          <Skeleton shape="text" className="mt-3.5 h-4 w-full max-w-md" />
          <Skeleton shape="text" className="mt-2.5 h-4 w-2/3" />

          <div className="mt-9 space-y-5">
            <div className="grid gap-1.5">
              <Skeleton shape="text" className="h-3 w-24" />
              <Skeleton shape="block" className="h-10 w-full" />
            </div>
            <Skeleton shape="block" className="h-11 w-40" />
          </div>
        </div>
      </div>
    </main>
  );
}
