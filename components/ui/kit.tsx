import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared design-kit for the authenticated product surfaces.
 *
 * Every primitive here speaks the single MotionCode design language ported from
 * the marketing site: true-black canvas, hairline borders, glassmorphism, a
 * single electric-blue accent used only for signal, PP Neue Montreal display
 * headings, and JetBrains-mono technical labels. Compose pages from these so the
 * app and the landing read as one product — never hand-roll ad-hoc surfaces or
 * hardcode off-black greens again.
 */

/* --------------------------------------------------------------------------- *
 * Eyebrow — mono, uppercase, tracked technical label. The lab's section tag.
 * --------------------------------------------------------------------------- */
export function Eyebrow({
  children,
  dot = false,
  className,
}: {
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-ink-3",
        className,
      )}
    >
      {dot && (
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-pulse-soft rounded-full bg-accent" />
          <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
        </span>
      )}
      {children}
    </span>
  );
}

/* --------------------------------------------------------------------------- *
 * PageHeader — the top of every authed page: eyebrow → display title → lede,
 * with an optional actions slot, resting on a hairline rule.
 * --------------------------------------------------------------------------- */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "grid gap-5 border-b border-hairline pb-7 lg:grid-cols-[1fr_auto] lg:items-end",
        className,
      )}
    >
      <div className="max-w-3xl">
        {eyebrow ? <Eyebrow dot>{eyebrow}</Eyebrow> : null}
        <h1 className="mt-3 font-display text-3xl font-medium leading-[1.05] tracking-tightest text-balance text-ink sm:text-[2.6rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3.5 max-w-2xl text-[15px] leading-7 text-ink-2 text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

/* --------------------------------------------------------------------------- *
 * Panel — the workhorse surface. `glass` for elevated/interactive cards,
 * `hairline` (default) for calm content blocks. Radius + padding are tunable.
 * --------------------------------------------------------------------------- */
type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "section" | "article" | "li" | "aside";
  variant?: "hairline" | "glass" | "bare";
  inset?: "none" | "sm" | "md" | "lg";
  radius?: "lg" | "xl" | "2xl";
  interactive?: boolean;
};

const INSET = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

const RADIUS = { lg: "rounded-xl", xl: "rounded-2xl", "2xl": "rounded-3xl" } as const;

export function Panel({
  as = "div",
  variant = "hairline",
  inset = "md",
  radius = "2xl",
  interactive = false,
  className,
  children,
  ...rest
}: PanelProps) {
  const Comp = as as React.ElementType;
  return (
    <Comp
      className={cn(
        "relative",
        RADIUS[radius],
        INSET[inset],
        variant === "glass" && "glass-card",
        variant === "hairline" && "bg-panel shadow-ring",
        variant === "bare" && "",
        interactive &&
          "transition-[transform,box-shadow,border-color] duration-300 ease-expo hover:-translate-y-0.5 hover:shadow-glow",
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/* --------------------------------------------------------------------------- *
 * StatTile — a labelled metric. Value in mono, label in tracked mono caps.
 * --------------------------------------------------------------------------- */
export function StatTile({
  label,
  value,
  hint,
  accent = false,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <Panel inset="none" radius="xl" className={cn("p-5", className)}>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-3">
        {label}
      </p>
      <p
        className={cn(
          "mt-2.5 break-words font-mono text-3xl leading-none tracking-tight tabular-nums",
          accent ? "text-accent" : "text-ink",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-2 break-words text-[13px] leading-5 text-ink-2">{hint}</p> : null}
    </Panel>
  );
}

/* --------------------------------------------------------------------------- *
 * Field kit — label + control, wired to the theme. Inputs are calm hairline
 * wells that light their border to accent on focus.
 * --------------------------------------------------------------------------- */
const controlBase =
  "w-full rounded-lg border border-hairline bg-[#0d0e11] px-3.5 text-base text-ink placeholder:text-ink-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-colors duration-200 focus:border-accent-border focus:ring-2 focus:ring-[var(--accent-dim)] disabled:opacity-50";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlBase, "h-11 min-h-[44px]", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(controlBase, "min-h-24 py-2.5", className)} {...props} />
));
Textarea.displayName = "Textarea";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="text-[12.5px] leading-5 text-ink-3">{hint}</p> : null}
    </div>
  );
}

/* --------------------------------------------------------------------------- *
 * Pill — small status/label chip. Neutral by default, accent/danger tones.
 * --------------------------------------------------------------------------- */
export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "danger" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10.5px] font-medium uppercase leading-none tracking-[0.16em]",
        tone === "neutral" && "border-hairline bg-white/[0.03] text-ink-2",
        tone === "muted" && "border-hairline text-ink-3",
        tone === "accent" && "border-accent-border bg-accent-dim text-accent",
        tone === "danger" &&
          "border-[var(--danger-border)] bg-[rgba(232,112,95,0.1)] text-[var(--danger)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------------------------- *
 * SectionLabel — a lightweight divider heading inside a page/panel.
 * --------------------------------------------------------------------------- */
export function SectionLabel({
  children,
  actions,
  className,
}: {
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3">
        {children}
      </h2>
      {actions}
    </div>
  );
}

/* --------------------------------------------------------------------------- *
 * EmptyState — calm centered zero-state inside a hairline well.
 * --------------------------------------------------------------------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Panel
      variant="hairline"
      inset="lg"
      className={cn(
        "grid place-items-center gap-3 border-dashed py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="grid size-11 place-items-center rounded-xl border border-hairline bg-white/[0.02] text-ink-3">
          {icon}
        </span>
      ) : null}
      <div className="max-w-sm">
        <h3 className="font-display text-lg text-ink">{title}</h3>
        {description ? (
          <p className="mt-1.5 text-[14px] leading-6 text-ink-2">{description}</p>
        ) : null}
      </div>
      {action}
    </Panel>
  );
}
