import { Skeleton } from "@/components/ui/skeleton";

/**
 * `/login` is force-dynamic (it reads `next`/`auth`/`signedOut` search params
 * server-side). The ambient accent wash is reproduced here so the skeleton and
 * the real page share the same room — only the card contents fill in.
 */
export default function LoginLoading() {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label="Loading sign in"
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-canvas px-4 py-6 text-ink sm:px-6"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 grid-fade opacity-70" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--accent-glow),transparent)]" />
        <div className="absolute left-1/2 top-[-18rem] size-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--accent-dim),transparent_70%)] blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-[940px]">
        <div
          aria-hidden
          className="grid gap-8 rounded-3xl bg-panel p-7 shadow-ring sm:p-10 lg:grid-cols-2 lg:gap-14"
        >
          <div className="flex flex-col justify-center">
            <Skeleton shape="pill" className="h-2.5 w-24 opacity-70" />
            <Skeleton shape="text" className="mt-5 h-9 w-full max-w-xs" />
            <Skeleton shape="text" className="mt-3.5 h-4 w-3/4" />
            <Skeleton shape="text" className="mt-2.5 h-4 w-2/3" />
          </div>

          <div className="flex flex-col justify-center gap-4">
            <Skeleton shape="block" className="h-11 w-full" />
            <div className="flex items-center gap-3">
              <Skeleton shape="text" className="h-px flex-1" />
              <Skeleton shape="text" className="h-3 w-8" />
              <Skeleton shape="text" className="h-px flex-1" />
            </div>
            <Skeleton shape="block" className="h-11 w-full" />
            <Skeleton shape="block" className="h-11 w-full" />
            <Skeleton shape="text" className="mt-2 h-3 w-2/3" />
          </div>
        </div>
      </div>
    </main>
  );
}
