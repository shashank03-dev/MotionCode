"use client";

import {
  Boxes,
  CreditCard,
  FolderKanban,
  Gauge,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Sparkles,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { PlanSync } from "@/components/dashboard/PlanSync";
import type { PlanTier } from "@/lib/contracts/plans";
import { cn } from "@/lib/utils";

type ProductNavKey = "analyze" | "dashboard" | "projects" | "workspaces";

type AppShellProps = {
  active?: ProductNavKey;
  children: ReactNode;
  userEmail?: string | null;
  /** Current user's id; enables live plan sync via Supabase Realtime. */
  userId?: string | null;
  /**
   * Plan tier of the current user. Drives the plan badge and the lock badge on
   * paid-only nav items (Dashboard / Projects / Workspaces). Defaults to "free".
   */
  planTier?: PlanTier;
  /**
   * When true the main area fills the viewport with no max-width / padding so a
   * full-bleed surface (the Analyze studio) can own the space.
   */
  bleed?: boolean;
};

// Nav keys that require a paid plan; locked for free users.
const PAID_NAV_KEYS = new Set<ProductNavKey>([
  "dashboard",
  "projects",
  "workspaces",
]);

// Remembers the collapsed sidebar preference across visits on this device.
// Backed by an external store so reads stay hydration-safe (the server and the
// first client render both see `false`) and a toggle re-renders every consumer.
const COLLAPSE_KEY = "motioncode_sidebar_collapsed";

const collapseListeners = new Set<() => void>();

const collapseStore = {
  subscribe(listener: () => void) {
    collapseListeners.add(listener);
    return () => collapseListeners.delete(listener);
  },
  getSnapshot() {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  },
  getServerSnapshot() {
    return false;
  },
  toggle() {
    const next = !collapseStore.getSnapshot();
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
    } catch {
      // Best-effort persistence; the UI still toggles for this session.
    }
    for (const listener of collapseListeners) listener();
  },
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

export function AppShell({
  active = "dashboard",
  children,
  userEmail,
  userId,
  planTier = "free",
  bleed = false,
}: AppShellProps) {
  const isFree = planTier === "free";
  const planLabel = planTier.charAt(0).toUpperCase() + planTier.slice(1);
  // Collapse only affects the lg layout; server + first client render see false.
  const collapsed = useSyncExternalStore(
    collapseStore.subscribe,
    collapseStore.getSnapshot,
    collapseStore.getServerSnapshot,
  );
  const toggleCollapsed = () => collapseStore.toggle();

  return (
    <div
      className={cn(
        "relative min-h-screen bg-[var(--bg)] text-[var(--text)] transition-[grid-template-columns] duration-200 ease-out motion-reduce:transition-none lg:grid",
        collapsed
          ? "lg:grid-cols-[3.5rem_minmax(0,1fr)]"
          : "lg:grid-cols-[15rem_minmax(0,1fr)]",
      )}
    >
      <PlanSync userId={userId} />

      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-80"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,251,244,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,251,244,0.026)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute right-[-18rem] top-[-20rem] h-[42rem] w-[42rem] rounded-full bg-[#00ff88]/[0.055] blur-3xl" />
      </div>

      {/* Solid (un-blurred) surface: animating a backdrop-blur'd sidebar's width
          re-rasterizes the blur every frame, which is what made collapse lag. */}
      <aside className="relative z-20 border-b border-[var(--border)] bg-[#0d0f0b] lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div
          className={cn(
            "flex h-full flex-col gap-6 px-3 py-4 lg:py-6",
            collapsed ? "lg:px-2" : "lg:px-4",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 px-1",
              collapsed && "lg:flex-col lg:gap-3 lg:px-0",
            )}
          >
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 font-mono text-sm font-bold tracking-[0.01em] text-[var(--text)] transition-colors hover:text-[#00ff88] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
            >
              <span className="text-[#00ff88]">&lt;/&gt;</span>{" "}
              <span className={cn(collapsed && "lg:hidden")}>MotionCode</span>
            </Link>
            <span
              title={`${planLabel} plan`}
              className={cn(
                "inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[8.5px] font-semibold uppercase leading-none tracking-[0.2em]",
                isFree
                  ? "border-[var(--border)] text-[var(--muted)]"
                  : "border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--accent)]",
                collapsed && "lg:hidden",
              )}
            >
              {planLabel}
            </span>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "hidden size-8 items-center justify-center rounded-md border border-transparent text-[var(--accent)] transition hover:border-[var(--border)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)] lg:flex",
                collapsed ? "lg:mx-auto" : "lg:ml-auto",
              )}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" aria-hidden="true" />
              ) : (
                <PanelLeftClose className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>

          <nav
            className="flex gap-2 overflow-x-auto max-lg:pb-1 lg:flex-col lg:gap-1 lg:overflow-visible"
            aria-label="Product"
          >
            <p
              className={cn(
                "hidden px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)] lg:block",
                collapsed && "lg:hidden",
              )}
            >
              Navigate
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;
              const locked = isFree && PAID_NAV_KEYS.has(item.key);

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  title={
                    collapsed
                      ? item.label
                      : locked
                        ? `${item.label} — upgrade to unlock`
                        : undefined
                  }
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-2 border px-3 font-sans text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] lg:rounded-md",
                    collapsed ? "lg:w-10 lg:justify-center lg:px-0" : "lg:w-full",
                    isActive
                      ? "border-[var(--accent-border)] bg-[var(--accent-dim)] font-medium text-[var(--text)]"
                      : "border-transparent text-[var(--accent)] hover:border-[var(--border)] hover:text-[var(--text)]",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className={cn(collapsed && "lg:hidden")}>
                    {item.label}
                  </span>
                  {locked ? (
                    <Lock
                      className={cn(
                        "ml-auto size-3 text-[var(--muted)]",
                        collapsed && "lg:hidden",
                      )}
                      aria-label="Paid feature"
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="hidden lg:mt-auto lg:flex lg:flex-col lg:gap-1">
            <p
              className={cn(
                "px-2 pb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]",
                collapsed && "lg:hidden",
              )}
            >
              Account
            </p>
            {utilityItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md border border-transparent px-3 font-sans text-sm text-[var(--accent)] transition hover:border-[var(--border)] hover:text-[var(--text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]",
                    collapsed && "lg:w-10 lg:justify-center lg:px-0",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className={cn(collapsed && "lg:hidden")}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
            <div
              className={cn(
                "mt-2 flex items-center gap-2 px-1",
                collapsed && "lg:flex-col lg:gap-1 lg:px-0",
              )}
            >
              {isFree ? (
                <Link
                  href="/pricing"
                  title="Upgrade your plan"
                  className={cn(
                    "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-[var(--accent-border)] bg-[var(--accent-dim)] font-sans text-sm text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]",
                    collapsed && "lg:size-10 lg:flex-none",
                  )}
                >
                  <Sparkles className="size-4 shrink-0" />
                  <span className={cn(collapsed && "lg:hidden")}>Upgrade</span>
                </Link>
              ) : (
                <Link
                  href="/onboarding"
                  title="New workspace"
                  className={cn(
                    "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-[var(--accent-border)] bg-[var(--accent-dim)] font-sans text-sm text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]",
                    collapsed && "lg:size-10 lg:flex-none",
                  )}
                >
                  <Plus className="size-4 shrink-0" />
                  <span className={cn(collapsed && "lg:hidden")}>New</span>
                </Link>
              )}
              {userEmail ? (
                <SignOutButton
                  className={cn(
                    "rounded-md border-[var(--border)] px-3 font-sans text-sm text-[var(--accent)] hover:border-[var(--accent-border)] hover:text-[var(--text)]",
                    collapsed && "lg:size-10 lg:px-0",
                  )}
                  label={collapsed ? "" : "Out"}
                />
              ) : null}
            </div>
          </div>

          {/* Mobile-only utility row */}
          <div className="flex items-center gap-2 lg:hidden">
            {utilityItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  className="inline-flex size-9 items-center justify-center border border-transparent text-[var(--accent)] transition hover:border-[var(--border)] hover:text-[var(--text)]"
                >
                  <Icon className="size-4" />
                </Link>
              );
            })}
            {isFree ? (
              <Link
                href="/pricing"
                title="Upgrade your plan"
                aria-label="Upgrade your plan"
                className="inline-flex size-9 items-center justify-center border border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--text)]"
              >
                <Sparkles className="size-4" />
              </Link>
            ) : (
              <Link
                href="/onboarding"
                title="New workspace"
                aria-label="New workspace"
                className="inline-flex size-9 items-center justify-center border border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--text)]"
              >
                <Plus className="size-4" />
              </Link>
            )}
            {userEmail ? (
              <SignOutButton
                className="h-9 border-[var(--border)] px-3 font-sans text-sm text-[var(--accent)]"
                label="Out"
              />
            ) : null}
          </div>
        </div>
      </aside>

      <main
        className={cn(
          "relative z-10 w-full",
          bleed
            ? "min-w-0 lg:h-screen lg:overflow-hidden"
            : "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8",
        )}
      >
        {children}
      </main>
    </div>
  );
}
