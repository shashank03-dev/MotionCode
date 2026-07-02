"use client";

import {
  Boxes,
  CreditCard,
  Gauge,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
  useSyncExternalStore,
  type MouseEvent,
  type ReactNode,
} from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { PlanSync } from "@/components/dashboard/PlanSync";
import type { PlanTier } from "@/lib/contracts/plans";
import type { WorkspaceTreeNode } from "@/lib/workbench/tree";
import { cn } from "@/lib/utils";

import { ExplorerTree } from "./explorer/ExplorerTree";

type WorkbenchProps = {
  tree: WorkspaceTreeNode[];
  userEmail?: string | null;
  /** Current user's id; enables live plan sync via Supabase Realtime. */
  userId?: string | null;
  children: ReactNode;
  /** Plan tier of the current user; drives the lock badge on paid nav links. */
  planTier?: PlanTier;
  /**
   * Full-bleed main pane (no max-width/padding). Defaults to true on /app so
   * the Analyze studio owns the viewport; other routes scroll with padding.
   */
  bleed?: boolean;
};

const navItems = [
  { href: "/app", icon: Sparkles, label: "Analyze", match: "/app", paid: false },
  {
    href: "/workspaces",
    icon: Boxes,
    label: "Workspaces",
    match: "/workspaces",
    paid: true,
  },
  {
    href: "/dashboard",
    icon: Gauge,
    label: "Dashboard",
    match: "/dashboard",
    paid: true,
  },
] as const;

const utilityItems = [
  { href: "/account", icon: UserCircle, label: "Account", match: "/account" },
  { href: "/billing", icon: CreditCard, label: "Billing", match: "/billing" },
] as const;

// Remembers the collapsed sidebar preference across visits on this device.
// Backed by an external store so reads stay hydration-safe (the server and the
// first client render both see `false`) and a toggle re-renders every consumer.
const COLLAPSE_KEY = "motioncode_workbench_collapsed";

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

function isDesktopViewport() {
  return window.matchMedia("(min-width: 1024px)").matches;
}

function RailLink({
  href,
  icon: Icon,
  label,
  active,
  locked = false,
}: {
  href: string;
  icon: typeof Sparkles;
  label: string;
  active: boolean;
  locked?: boolean;
}) {
  return (
    <Link
      href={href}
      title={locked ? `${label} — upgrade to unlock` : label}
      aria-label={locked ? `${label}, paid feature` : label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex size-10 items-center justify-center border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        active
          ? "border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--text)]"
          : "border-transparent text-[var(--accent)] hover:border-[var(--border)] hover:text-[var(--text)]",
      )}
    >
      <Icon className="size-4" />
      {locked ? (
        <Lock
          className="absolute right-0.5 top-0.5 size-2.5 text-[var(--muted)]"
          aria-hidden="true"
        />
      ) : null}
    </Link>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  locked = false,
}: {
  href: string;
  icon: typeof Sparkles;
  label: string;
  active: boolean;
  locked?: boolean;
}) {
  return (
    <Link
      href={href}
      title={locked ? `${label} — upgrade to unlock` : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 w-full items-center gap-2.5 border px-3 font-sans text-[13px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
        active
          ? "border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--text)]"
          : "border-transparent text-[var(--accent)] hover:border-[var(--border)] hover:text-[var(--text)]",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
      {locked ? (
        <Lock
          className="ml-auto size-3 shrink-0 text-[var(--muted)]"
          aria-label="Paid feature"
        />
      ) : null}
    </Link>
  );
}

export function Workbench({
  tree,
  userEmail,
  userId,
  children,
  planTier = "free",
  bleed,
}: WorkbenchProps) {
  const pathname = usePathname();
  const isFree = planTier === "free";
  const planLabel = planTier.charAt(0).toUpperCase() + planTier.slice(1);
  const isBleed = bleed ?? pathname === "/app";

  // Desktop (lg+) collapse is persisted; the mobile slide-over is per-visit
  // state so the overlay never auto-opens on page load.
  const collapsed = useSyncExternalStore(
    collapseStore.subscribe,
    collapseStore.getSnapshot,
    collapseStore.getServerSnapshot,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const openSidebar = () => {
    if (isDesktopViewport()) {
      collapseStore.toggle();
    } else {
      setMobileOpen(true);
    }
  };

  const closeSidebar = () => {
    if (isDesktopViewport()) {
      collapseStore.toggle();
    } else {
      setMobileOpen(false);
    }
  };

  // Escape closes the mobile slide-over, mirroring a standard drawer.
  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  // Following a link in the slide-over should also dismiss it.
  const closeOnNavigate = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("a")) {
      setMobileOpen(false);
    }
  };

  const isActive = (match: string) =>
    pathname === match || pathname.startsWith(`${match}/`);

  return (
    <div className="relative min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <PlanSync userId={userId} />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-80"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,251,244,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,251,244,0.026)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute right-[-18rem] top-[-20rem] h-[42rem] w-[42rem] rounded-full bg-[#00ff88]/[0.055] blur-3xl" />
      </div>

      <div
        className={cn(
          "relative z-10 grid min-h-screen",
          collapsed
            ? "grid-cols-[3.5rem_minmax(0,1fr)]"
            : "grid-cols-[3.5rem_minmax(0,1fr)] lg:grid-cols-[17.5rem_minmax(0,1fr)]",
        )}
      >
        {/* Icon rail — the collapsed sidebar on lg+, and the permanent
            launcher column on smaller screens. */}
        <aside
          className={cn(
            "sticky top-0 z-20 flex h-screen flex-col items-center gap-3 border-r border-[var(--border)] bg-[#0d0f0b]/92 py-4 backdrop-blur-xl",
            !collapsed && "lg:hidden",
          )}
          aria-label="Sidebar (collapsed)"
        >
          <Link
            href="/app"
            title="MotionCode"
            className="flex size-10 items-center justify-center font-mono text-sm font-bold text-[var(--text)] transition-colors hover:text-[#00ff88]"
          >
            &lt;/&gt;
          </Link>
          <span className="h-px w-8 bg-[var(--border)]" aria-hidden="true" />

          <nav className="flex flex-col items-center gap-1" aria-label="Sections">
            {navItems.map((item) => (
              <RailLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.match)}
                locked={isFree && item.paid}
              />
            ))}
          </nav>

          <div className="mt-auto flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={openSidebar}
              title="Open sidebar"
              aria-label="Open sidebar"
              className="flex size-10 items-center justify-center border border-transparent text-[var(--accent)] transition hover:border-[var(--border)] hover:text-[var(--text)]"
            >
              <PanelLeftOpen className="size-4" />
            </button>
            <span className="h-px w-8 bg-[var(--border)]" aria-hidden="true" />
            {utilityItems.map((item) => (
              <RailLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.match)}
              />
            ))}
            {userEmail ? (
              <SignOutButton
                className="w-10 justify-center border-transparent px-0 text-[var(--accent)] hover:border-[var(--border)] hover:text-[var(--text)]"
                label=""
              />
            ) : null}
          </div>
        </aside>

        {/* Backdrop behind the mobile slide-over. */}
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        ) : null}

        {/* Full-size sidebar: brand, labeled navigation, the workspace
            explorer filling the remaining height, account at the bottom.
            Static column on lg+, slide-over on smaller screens. */}
        <aside
          onClick={closeOnNavigate}
          className={cn(
            "inset-y-0 left-0 z-40 h-screen w-[17.5rem] flex-col border-r border-[var(--border)] bg-[#0d0f0b]",
            mobileOpen ? "fixed flex shadow-[24px_0_60px_rgba(0,0,0,0.55)]" : "hidden",
            !collapsed
              ? "lg:sticky lg:top-0 lg:z-10 lg:flex lg:shadow-none"
              : "lg:hidden",
          )}
          aria-label="Sidebar"
        >
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] pl-4 pr-2">
            <Link
              href="/app"
              className="truncate font-mono text-sm font-bold tracking-[0.01em] text-[var(--text)] transition-colors hover:text-[#00ff88]"
            >
              &lt;/&gt; MotionCode
            </Link>
            <div className="flex items-center gap-2">
              <span
                title={`${planLabel} plan`}
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 font-sans text-[10px] font-semibold uppercase leading-none tracking-[0.08em]",
                  isFree
                    ? "border-[var(--border)] text-[var(--accent)]/70"
                    : "border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--accent)]",
                )}
              >
                {planLabel}
              </span>
              <button
                type="button"
                onClick={closeSidebar}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="flex size-8 items-center justify-center border border-transparent text-[var(--accent)] transition hover:border-[var(--border)] hover:text-[var(--text)]"
              >
                <PanelLeftClose className="size-4" />
              </button>
            </div>
          </div>

          <nav
            className="flex shrink-0 flex-col gap-1 px-3 py-3"
            aria-label="Sections"
          >
            {navItems.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.match)}
                locked={isFree && item.paid}
              />
            ))}
          </nav>

          <div className="min-h-0 flex-1 border-t border-[var(--border)] pt-1">
            <ExplorerTree tree={tree} />
          </div>

          <div className="shrink-0 border-t border-[var(--border)] px-3 py-3">
            <div className="flex flex-col gap-1">
              {utilityItems.map((item) => (
                <SidebarLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.match)}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              {isFree ? (
                <Link
                  href="/pricing"
                  title="Upgrade your plan"
                  className="inline-flex h-9 flex-1 items-center justify-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] font-sans text-[13px] font-medium text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10"
                >
                  <Sparkles className="size-4" aria-hidden="true" />
                  Upgrade
                </Link>
              ) : null}
              {userEmail ? (
                <SignOutButton
                  className={cn(
                    "h-9 border-[var(--border)] px-3 font-sans text-[13px] font-medium text-[var(--accent)] hover:border-[var(--accent-border)] hover:text-[var(--text)]",
                    !isFree && "flex-1 justify-center",
                  )}
                  label="Sign out"
                />
              ) : null}
            </div>
          </div>
        </aside>

        {/* Main pane */}
        <main
          className={cn(
            "relative z-10 min-w-0",
            isBleed
              ? "h-screen overflow-hidden"
              : "h-screen overflow-y-auto px-4 py-6 sm:px-6 lg:px-8",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
