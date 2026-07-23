import { ArrowUpRight, Check, Lock, Sparkles } from "lucide-react";

import { Eyebrow } from "@/components/ui/kit";
import { ButtonLink } from "@/components/ui/site-button";

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
      <span className="accent-underglow inline-flex size-12 items-center justify-center rounded-2xl border border-accent-border bg-accent-dim text-accent shadow-glow">
        <Lock className="size-5" aria-hidden="true" />
      </span>

      <Eyebrow className="mt-7">Paid feature</Eyebrow>
      <h1 className="mt-3 font-display text-3xl font-medium leading-[1.05] tracking-tightest text-ink sm:text-4xl">
        Upgrade to unlock {feature}.
      </h1>
      <p className="mt-3.5 max-w-md text-[15px] leading-7 text-ink-2 text-pretty">
        {description ??
          `${feature} is part of MotionCode Pro. Keep analyzing motion for free, or upgrade to manage saved work and your team.`}
      </p>

      <ul className="mt-7 grid w-full max-w-sm gap-2.5 text-left">
        {DEFAULT_BENEFITS.map((benefit) => (
          <li
            key={benefit}
            className="flex items-center gap-2.5 text-[14px] text-ink-2"
          >
            <Check className="size-4 shrink-0 text-accent" aria-hidden="true" />
            {benefit}
          </li>
        ))}
      </ul>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <ButtonLink href="/pricing" variant="primary" size="md">
          View plans
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </ButtonLink>
        <ButtonLink href="/app" variant="outline" size="md">
          <Sparkles className="size-4" aria-hidden="true" />
          Back to Analyze
        </ButtonLink>
      </div>
    </div>
  );
}
