import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[-0.01em] transition-[background-color,color,box-shadow,transform] duration-300 ease-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        // Safelight: the one signal colour. Hover settles to bone.
        primary:
          "bg-accent text-carbon hover:bg-bone active:scale-[0.98]",
        solid:
          "bg-bone text-carbon hover:bg-accent active:scale-[0.98]",
        frosted:
          "bg-bone/[0.05] text-ink shadow-ring backdrop-blur hover:bg-bone/[0.09] active:scale-[0.98]",
        ghost:
          "bg-transparent text-ink-2 hover:text-ink hover:bg-bone/[0.05]",
        outline:
          "bg-transparent text-ink shadow-[inset_0_0_0_1px_var(--border-strong)] hover:shadow-[inset_0_0_0_1px_var(--text)] active:scale-[0.98]",
      },
      size: {
        sm: "h-9 px-4 text-[13px] max-sm:h-auto max-sm:min-h-[44px]",
        md: "h-11 px-5 text-sm",
        lg: "h-[52px] px-7 text-[15px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(button({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

// Anchor variant sharing the same styles (for CTAs that are links).
export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof button> {}

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant, size, ...props }, ref) => (
    <a
      ref={ref}
      className={cn(button({ variant, size }), className)}
      {...props}
    />
  ),
);
ButtonLink.displayName = "ButtonLink";

export { button as buttonVariants };
