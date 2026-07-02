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
import { useState, type ReactNode } from "react";

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
  /** Plan tier of the current user; drives the lock badge on paid rail links. */
  planTier?: PlanTier;
  /**
   * Full-bleed main pane (no max-width/padding). Defaults to true on /app so
   * the Analyze studio owns the viewport; other routes scroll with padding.
   */
  bleed?: boolean;
};

const railItems = [
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

const railUtility = [
  { href: "/account", icon: UserCircle, label: "Account", match: "/account" },
  { href: "/billing", icon: CreditCard, label: "Billing", match: "/billing" },
] as const;

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

export function Workbench({
  tree,
  userEmail,
  userId,
  children,
  planTier = "free",
  bleed,
}: WorkbenchProps) {
  const pathname = usePathname();
  const [explorerOpen, setExplorerOpen] = useState(true);
  const isFree = planTier === "free";
  const isBleed = bleed ?? pathname === "/app";

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
          explorerOpen
            ? "grid-cols-[3.5rem_minmax(0,1fr)] lg:grid-cols-[3.5rem_16rem_minmax(0,1fr)]"
            : "grid-cols-[3.5rem_minmax(0,1fr)]",
        )}
      >
        {/* Icon rail */}
        <aside className="z-20 flex h-screen flex-col items-center gap-3 border-r border-[var(--border)] bg-[#0d0f0b]/92 py-4 backdrop-blur-xl lg:sticky lg:top-0">
          <Link
            href="/app"
            title="MotionCode"
            className="flex size-10 items-center justify-center font-mono text-sm font-bold text-[var(--text)] transition-colors hover:text-[#00ff88]"
          >
            &lt;/&gt;
          </Link>
          <button
            type="button"
            onClick={() => setExplorerOpen((open) => !open)}
            title={explorerOpen ? "Hide explorer" : "Show explorer"}
            aria-label={explorerOpen ? "Hide explorer" : "Show explorer"}
            className="flex size-10 items-center justify-center border border-transparent text-[var(--accent)] transition hover:border-[var(--border)] hover:text-[var(--text)]"
          >
            {explorerOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </button>

          <nav className="flex flex-col items-center gap-1" aria-label="Sections">
            {railItems.map((item) => (
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
            {railUtility.map((item) => (
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

        {/* Explorer column */}
        {explorerOpen ? (
          <aside className="z-10 hidden h-screen flex-col border-r border-[var(--border)] bg-[#0d0f0b]/85 backdrop-blur-xl lg:sticky lg:top-0 lg:flex">
            <ExplorerTree tree={tree} />
          </aside>
        ) : null}

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
