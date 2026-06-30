import { ArrowUpRight, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

type UpgradeGateProps = {
  /** Feature name shown in the headline, e.g. "Projects". */
  feature: string;
  /** Optional one-line description of what the paid surface unlocks. */
  description?: string;
};

const DEFAULT_BENEFITS = [
  "Save analyses as versioned projects",
  "Organize work across team workspaces",
  "Edit & export generated code",
] as const;

/**
 * In-place paywall rendered by paid-only pages for free-tier users instead of a
 * silent redirect. Lives inside whatever shell already wraps the page.
 */
export function UpgradeGate({ feature, description }: UpgradeGateProps) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full border border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--accent)]">
        <Lock className="size-5" aria-hidden="true" />
      </span>

      <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
        Paid feature
      </p>
      <h1 className="mt-3 font-mono text-2xl leading-tight text-[var(--text)] sm:text-3xl">
        Upgrade to unlock {feature}.
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--accent)]">
        {description ??
          `${feature} is part of MotionCode Pro. Keep analyzing motion for free, or upgrade to manage saved work and your team.`}
      </p>

      <ul className="mt-6 grid w-full max-w-sm gap-2 text-left">
        {DEFAULT_BENEFITS.map((benefit) => (
          <li
            key={benefit}
            className="flex items-center gap-2 font-mono text-xs text-[var(--text)]"
          >
            <Sparkles className="size-3.5 shrink-0 text-[#00ff88]" aria-hidden="true" />
            {benefit}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/pricing"
          className="inline-flex h-10 items-center justify-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-5 font-mono text-sm text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          View plans
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href="/app"
          className="inline-flex h-10 items-center justify-center gap-2 border border-[var(--border)] px-5 font-mono text-sm text-[var(--accent)] transition hover:border-[var(--accent-border)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          Back to Analyze
        </Link>
      </div>
    </div>
  );
}
