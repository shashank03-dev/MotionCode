import { cn } from "@/lib/utils";

/** MotionCode mark — three sampled frames easing into a curve. */
export function Logo({
  className,
  wordmark = true,
}: {
  className?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        aria-hidden
        className="shrink-0"
      >
        <rect x="1" y="1" width="20" height="20" rx="6" stroke="var(--hairline-strong)" />
        <path
          d="M4 16 C 8 16, 8 6, 12 6 S 16 10, 18 6"
          stroke="var(--accent)"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="4" cy="16" r="1.6" fill="#fff" />
        <circle cx="18" cy="6" r="1.6" fill="var(--accent)" />
      </svg>
      {wordmark ? (
        <span className="font-display text-[17px] font-medium tracking-tight text-ink">
          MotionCode
        </span>
      ) : null}
    </span>
  );
}
