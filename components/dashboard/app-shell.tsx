import {
  Boxes,
  CreditCard,
  FolderKanban,
  Gauge,
  Plus,
  Sparkles,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

type ProductNavKey = "analyze" | "dashboard" | "projects" | "workspaces";

type AppShellProps = {
  active?: ProductNavKey;
  children: ReactNode;
  userEmail?: string | null;
};

const navItems = [
  { href: "/app", icon: Sparkles, key: "analyze", label: "Analyze" },
  { href: "/dashboard", icon: Gauge, key: "dashboard", label: "Dashboard" },
  { href: "/projects", icon: FolderKanban, key: "projects", label: "Projects" },
  { href: "/workspaces", icon: Boxes, key: "workspaces", label: "Workspaces" },
] as const;

const utilityItems = [
  { href: "/account", icon: UserCircle, label: "Account" },
  { href: "/billing", icon: CreditCard, label: "Billing" },
] as const;

export function AppShell({ active = "dashboard", children, userEmail }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-80"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,251,244,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,251,244,0.026)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(0,255,136,0.44),transparent)]" />
        <div className="absolute right-[-18rem] top-[-20rem] h-[42rem] w-[42rem] rounded-full bg-[#00ff88]/[0.055] blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[#0d0f0b]/92 shadow-[0_18px_42px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/app"
              className="font-mono text-sm font-bold tracking-[0.02em] text-[var(--text)] transition-colors hover:text-[#00ff88] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              &lt;/&gt; MotionCode
            </Link>
            <span className="hidden border border-[var(--accent-border)] bg-[var(--accent-dim)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)] sm:inline-flex">
              workspace lab
            </span>
          </div>

          <nav
            className="order-3 flex w-full gap-2 overflow-x-auto sm:order-none sm:w-auto"
            aria-label="Product"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-2 border px-3 font-mono text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]",
                    isActive
                      ? "border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--text)]"
                      : "border-transparent text-[var(--accent)] hover:border-[var(--border)] hover:text-[var(--text)]",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {utilityItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  className="inline-flex size-9 items-center justify-center border border-transparent font-mono text-xs text-[var(--accent)] transition hover:border-[var(--border)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] md:w-auto md:px-3"
                >
                  <Icon className="size-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
            <Link
              href="/onboarding"
              className="inline-flex size-9 items-center justify-center border border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
              title="New workspace"
            >
              <Plus className="size-4" />
            </Link>
            {userEmail ? (
              <SignOutButton
                className="h-9 border-[var(--border)] px-3 font-mono text-xs text-[var(--accent)] hover:border-[var(--accent-border)] hover:text-[var(--text)]"
                label="Out"
              />
            ) : null}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
