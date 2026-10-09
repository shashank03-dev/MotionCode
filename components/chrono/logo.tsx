import { cn } from "@/lib/utils";

/**
 * MotionCode mark — a chronophotographic exposure: five samples of one point
 * moving along an expo-out curve. Spacing compresses as the motion settles;
 * the final, resting sample is lit in safelight.
 */
const SAMPLES = [
  [3, 17],
  [8.4, 9.6],
  [12.6, 6.4],
  [16, 5.2],
  [19, 5],
] as const;

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        d="M3 17 C 7 7, 11 5, 19 5"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1"
        fill="none"
      />
      {SAMPLES.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === SAMPLES.length - 1 ? 2.2 : 1.35}
          fill={i === SAMPLES.length - 1 ? "var(--accent)" : "currentColor"}
          fillOpacity={i === SAMPLES.length - 1 ? 1 : 0.35 + i * 0.15}
        />
      ))}
    </svg>
  );
}

export function Logo({
  className,
  wordmark = true,
}: {
  className?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2 text-ink", className)}>
      <LogoMark />
      {wordmark ? (
        <span className="font-display text-[16px] font-medium tracking-[-0.03em]">
          MotionCode
        </span>
      ) : null}
    </span>
  );
}
