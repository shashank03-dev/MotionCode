import { cn } from "@/lib/utils";

/**
 * Loading-state primitives shared by every route-level `loading.tsx`.
 *
 * These replace the old hand-rolled `animate-pulse bg-white/10` blocks, which
 * read as a generic template rather than the MotionCode design language. The
 * shimmer is a single accent-tinted sweep travelling across a hairline well —
 * the same electric-blue signal used elsewhere, held well below CTA intensity
 * so a loading state never competes with a real action.
 *
 * Skeletons are decorative: they carry no text and are hidden from assistive
 * tech. The route's `loading.tsx` owns the accessible label instead.
 *
 * Under `prefers-reduced-motion` the sweep is suppressed (see
 * `.mc-skeleton` in globals.css) and the well renders as a calm static shape.
 */

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Corner treatment. `pill` for chips/buttons, `text` for copy lines. */
  shape?: "text" | "block" | "pill" | "circle";
};

const SHAPE = {
  text: "rounded-[6px]",
  block: "rounded-[10px]",
  pill: "rounded-full",
  circle: "rounded-full aspect-square",
} as const;

export function Skeleton({
  shape = "block",
  className,
  ...rest
}: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("mc-skeleton", SHAPE[shape], className)}
      {...rest}
    />
  );
}

/**
 * A paragraph of skeleton copy. The last line is short so the block reads as
 * text rather than as a solid slab.
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          shape="text"
          className={cn("h-3.5", i === lines - 1 ? "w-2/5" : "w-full")}
        />
      ))}
    </div>
  );
}

/**
 * A hairline panel matching `Panel` from the kit, pre-filled with a title line
 * and body copy. Use for card grids and list rows.
 */
export function SkeletonCard({
  lines = 2,
  className,
  children,
}: {
  lines?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-2xl bg-panel p-5 shadow-ring sm:p-6",
        className,
      )}
    >
      {children ?? (
        <>
          <Skeleton shape="text" className="h-4 w-1/3" />
          <SkeletonText lines={lines} className="mt-4" />
        </>
      )}
    </div>
  );
}

/**
 * The standard page chrome for an authed route: eyebrow, display title, lede,
 * and an optional action cluster. Mirrors `PageHeader` from the kit so the
 * skeleton fills in rather than swaps out.
 */
export function SkeletonPageHeader({
  actions = 0,
  className,
}: {
  actions?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid gap-5 border-b border-hairline pb-7 lg:grid-cols-[1fr_auto] lg:items-end",
        className,
      )}
    >
      <div className="max-w-3xl">
        <Skeleton shape="pill" className="h-2.5 w-32 opacity-70" />
        <Skeleton shape="text" className="mt-4 h-9 w-full max-w-md" />
        <Skeleton shape="text" className="mt-3.5 h-4 w-3/4 max-w-lg" />
      </div>
      {actions > 0 ? (
        <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
          {Array.from({ length: actions }).map((_, i) => (
            <Skeleton key={i} shape="block" className="h-10 w-28" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Full-page wrapper. Owns the accessible status label so individual skeleton
 * shapes can stay `aria-hidden`, and screen readers announce one clear
 * "loading X" instead of a wall of empty boxes.
 */
export function SkeletonPage({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <main
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn(
        "min-h-screen bg-canvas px-4 py-10 text-ink sm:px-6 lg:px-8",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-6xl">{children}</div>
    </main>
  );
}
