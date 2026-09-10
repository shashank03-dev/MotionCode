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
import { Logo } from "@/components/site/logo";
import { AppBackground } from "@/components/ui/app-background";
import type { PlanTier } from "@/lib/contracts/plans";
import { cn } from "@/lib/utils";

type WorkbenchProps = {
  explorer: ReactNode;
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
        "relative flex size-10 items-center justify-center rounded-lg border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]",
        active
          ? "border-accent-border bg-accent-dim text-ink"
          : "border-transparent text-ink-2 hover:border-hairline hover:text-ink",
      )}
    >
      <Icon className="size-4" />
      {locked ? (
        <Lock
          className="absolute right-0.5 top-0.5 size-2.5 text-ink-3"
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
        "group inline-flex h-9 w-full items-center gap-2.5 rounded-lg border px-3 font-sans text-[13px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]",
        active
          ? "border-accent-border bg-accent-dim text-ink"
          : "border-transparent text-ink-2 hover:border-hairline hover:bg-white/[0.03] hover:text-ink",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-accent" : "text-ink-3 group-hover:text-ink-2",
        )}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
      {locked ? (
        <Lock
          className="ml-auto size-3 shrink-0 text-ink-3"
          aria-label="Paid feature"
        />
      ) : null}
    </Link>
  );
}

export function Workbench({
  explorer,
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

  // A single contextual billing control replaces the old Upgrade + Billing
  // pair: free users see the conversion path, paid users get subscription
  // management. Same slot in both the collapsed rail and the full sidebar.
  const billingControl = isFree
    ? {
        href: "/pricing",
        icon: Sparkles,
        label: "Upgrade",
        title: "Upgrade your plan",
        match: "/pricing",
      }
    : {
        href: "/billing",
        icon: CreditCard,
        label: "Billing",
        title: "Manage billing",
        match: "/billing",
      };

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
    <div className="relative min-h-screen bg-canvas text-ink">
      <PlanSync userId={userId} />
      <AppBackground />

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
            "sticky top-0 z-20 flex h-screen flex-col items-center gap-3 border-r border-hairline bg-panel/85 py-4 backdrop-blur-xl",
            !collapsed && "lg:hidden",
          )}
          aria-label="Sidebar (collapsed)"
        >
          <Link
            href="/"
            title="MotionCode — home"
            aria-label="MotionCode home"
            className="flex size-10 items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]"
          >
            <Logo wordmark={false} />
          </Link>
          <span className="h-px w-8 bg-hairline" aria-hidden="true" />

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
              className="flex size-10 items-center justify-center border border-transparent text-ink-2 transition hover:border-hairline hover:text-ink"
            >
              <PanelLeftOpen className="size-4" />
            </button>
            <span className="h-px w-8 bg-hairline" aria-hidden="true" />
            {utilityItems.map((item) => (
              <RailLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.match)}
              />
            ))}
            <RailLink
              href={billingControl.href}
              icon={billingControl.icon}
              label={billingControl.label}
              active={isActive(billingControl.match)}
            />
            {userEmail ? (
              <SignOutButton
                className="w-10 justify-center border-transparent px-0 text-ink-2 hover:border-hairline hover:text-ink"
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
            "inset-y-0 left-0 z-40 h-screen w-[17.5rem] flex-col border-r border-hairline bg-panel",
            mobileOpen ? "fixed flex shadow-[24px_0_60px_rgba(0,0,0,0.55)]" : "hidden",
            !collapsed
              ? "lg:sticky lg:top-0 lg:z-10 lg:flex lg:shadow-none"
              : "lg:hidden",
          )}
          aria-label="Sidebar"
        >
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-hairline pl-4 pr-2">
            <Link
              href="/"
              aria-label="MotionCode home"
              className="min-w-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-border)]"
            >
              <Logo />
            </Link>
            <div className="flex items-center gap-2">
              <span
                title={`${planLabel} plan`}
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 font-sans text-[10px] font-semibold uppercase leading-none tracking-[0.08em]",
                  isFree
                    ? "border-hairline text-ink-3"
                    : "border-accent-border bg-accent-dim text-accent",
                )}
              >
                {planLabel}
              </span>
              <button
                type="button"
                onClick={closeSidebar}
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
                className="flex size-8 items-center justify-center border border-transparent text-ink-2 transition hover:border-hairline hover:text-ink"
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

          <div className="min-h-0 flex-1 border-t border-hairline pt-1">
            {explorer}
          </div>

          <div className="shrink-0 border-t border-hairline px-3 py-3">
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
              <Link
                href={billingControl.href}
                title={billingControl.title}
                className={cn(
                  "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border font-sans text-[13px] font-medium transition",
                  isFree
                    ? "border-accent-border bg-accent-dim text-ink hover:border-accent hover:bg-accent/10"
                    : "border-hairline text-ink-2 hover:border-accent-border hover:text-ink",
                )}
              >
                <billingControl.icon className="size-4" aria-hidden="true" />
                {billingControl.label}
              </Link>
              {userEmail ? (
                <SignOutButton
                  className="h-9 flex-1 justify-center rounded-lg border-hairline px-3 font-sans text-[13px] font-medium text-ink-2 hover:border-accent-border hover:text-ink"
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
