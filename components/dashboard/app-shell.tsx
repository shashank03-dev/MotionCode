"use client";

import {
  Boxes,
  CreditCard,
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
import { Logo } from "@/components/site/logo";
import { AppBackground } from "@/components/ui/app-background";
import type { PlanTier } from "@/lib/contracts/plans";
import { cn } from "@/lib/utils";

type ProductNavKey = "analyze" | "dashboard" | "workspaces";

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
const PAID_NAV_KEYS = new Set<ProductNavKey>(["dashboard", "workspaces"]);

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
  { href: "/workspaces", icon: Boxes, key: "workspaces", label: "Workspaces" },
  { href: "/dashboard", icon: Gauge, key: "dashboard", label: "Dashboard" },
] as const;

const utilityItems = [
  { href: "/account", icon: UserCircle, label: "Account" },
  { href: "/billing", icon: CreditCard, label: "Billing" },
] as const;

// Shared nav-item styling. Accent is reserved for the *active* item and focus
// rings only — idle items rest at ink-2 so the sidebar stays quiet.
const navItemBase =
  "group inline-flex min-h-[44px] shrink-0 items-center gap-2.5 rounded-lg border px-3 py-2 text-[13.5px] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]";
const navItemIdle =
  "border-transparent text-ink-2 hover:border-hairline hover:bg-white/[0.03] hover:text-ink";
const navItemActive =
  "border-accent-border bg-accent-dim font-medium text-ink shadow-[inset_0_0_0_1px_var(--accent-border)]";

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
        "relative min-h-dvh bg-canvas text-ink transition-[grid-template-columns] duration-200 ease-out motion-reduce:transition-none lg:grid",
        collapsed
          ? "lg:grid-cols-[3.75rem_minmax(0,1fr)]"
          : "lg:grid-cols-[15.5rem_minmax(0,1fr)]",
      )}
    >
      <PlanSync userId={userId} />
      <AppBackground />

      <aside className="relative z-20 border-b border-hairline bg-panel/80 backdrop-blur-xl max-lg:backdrop-blur-none lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div
          className={cn(
            "flex h-full flex-col gap-7 px-3 py-4 lg:py-6",
            collapsed ? "lg:px-2.5" : "lg:px-4",
          )}
        >
          {/* Brand + plan + collapse toggle */}
          <div
            className={cn(
              "flex items-center gap-2.5 px-1",
              collapsed && "lg:flex-col lg:gap-3 lg:px-0",
            )}
          >
            <Link
              href="/app"
              aria-label="MotionCode home"
              className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-border)]"
            >
              <Logo wordmark={!collapsed} />
            </Link>
            <span
              title={`${planLabel} plan`}
              className={cn(
                "inline-flex items-center rounded-full border px-1.5 py-0.5 font-mono text-[8.5px] font-semibold uppercase leading-none tracking-[0.2em]",
                isFree
                  ? "border-hairline text-ink-3"
                  : "border-accent-border bg-accent-dim text-accent",
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
                "hidden size-8 items-center justify-center rounded-md border border-transparent text-ink-3 transition hover:border-hairline hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)] lg:flex",
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

          {/* Primary product nav */}
          <nav
            className="flex gap-2 overflow-x-auto max-lg:pb-1 lg:flex-col lg:gap-1 lg:overflow-visible"
            aria-label="Product"
          >
            <p
              className={cn(
                "hidden px-2 pb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3 lg:block",
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
                  aria-label={item.label}
                  title={
                    collapsed
                      ? item.label
                      : locked
                        ? `${item.label} — upgrade to unlock`
                        : undefined
                  }
                  className={cn(
                    navItemBase,
                    isActive ? navItemActive : navItemIdle,
                    collapsed ? "lg:w-11 lg:justify-center lg:px-0" : "lg:w-full",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-[17px] shrink-0 transition-colors",
                      isActive ? "text-accent" : "text-ink-3 group-hover:text-ink-2",
                    )}
                  />
                  <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                  {locked ? (
                    <Lock
                      className={cn(
                        "ml-auto size-3 text-ink-3",
                        collapsed && "lg:hidden",
                      )}
                      aria-label="Paid feature"
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/* Utility + account cluster (desktop) */}
          <div className="hidden lg:mt-auto lg:flex lg:flex-col lg:gap-1">
            <p
              className={cn(
                "px-2 pb-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3",
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
                    navItemBase,
                    navItemIdle,
                    collapsed && "lg:w-11 lg:justify-center lg:px-0",
                  )}
                >
                  <Icon className="size-[17px] shrink-0 text-ink-3 transition-colors group-hover:text-ink-2" />
                  <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                </Link>
              );
            })}
            <div
              className={cn(
                "mt-3 flex items-center gap-2 px-1",
                collapsed && "lg:flex-col lg:gap-1.5 lg:px-0",
              )}
            >
              {isFree ? (
                <Link
                  href="/pricing"
                  title="Upgrade your plan"
                  className={cn(
                    "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-accent text-[13px] font-medium text-black shadow-glow transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]",
                    collapsed && "lg:size-11 lg:flex-none",
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
                    "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-hairline bg-white/[0.03] text-[13px] font-medium text-ink transition hover:border-accent-border hover:bg-accent-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]",
                    collapsed && "lg:size-11 lg:flex-none",
                  )}
                >
                  <Plus className="size-4 shrink-0" />
                  <span className={cn(collapsed && "lg:hidden")}>New</span>
                </Link>
              )}
              {userEmail ? (
                <SignOutButton
                  className={cn(
                    "h-9 rounded-lg border-hairline px-3 text-[13px] text-ink-2 hover:border-accent-border hover:text-ink",
                    collapsed && "lg:size-11 lg:px-0",
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
                  className="inline-flex size-11 items-center justify-center rounded-lg border border-transparent text-ink-2 transition hover:border-hairline hover:text-ink"
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
                className="inline-flex size-11 items-center justify-center rounded-lg bg-accent text-black shadow-glow"
              >
                <Sparkles className="size-4" />
              </Link>
            ) : (
              <Link
                href="/onboarding"
                title="New workspace"
                aria-label="New workspace"
                className="inline-flex size-11 items-center justify-center rounded-lg border border-accent-border bg-accent-dim text-ink"
              >
                <Plus className="size-4" />
              </Link>
            )}
            {userEmail ? (
              <SignOutButton
                className="h-11 rounded-lg border-hairline px-3 text-[13px] text-ink-2"
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
            : "mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-10 lg:py-10",
        )}
      >
        {children}
      </main>
    </div>
  );
}
