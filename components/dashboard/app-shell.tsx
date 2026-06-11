import { FolderKanban, Gauge, Play, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { cn } from "@/lib/utils";

type AppShellProps = {
  active?: "app" | "dashboard" | "projects" | "workspaces";
  children: ReactNode;
  userEmail?: string | null;
};

const navItems = [
  { href: "/app", icon: Play, key: "app", label: "App" },
  { href: "/dashboard", icon: Gauge, key: "dashboard", label: "Dashboard" },
  { href: "/dashboard#workspaces", icon: FolderKanban, key: "workspaces", label: "Workspaces" },
  { href: "/dashboard#projects", icon: Sparkles, key: "projects", label: "Projects" },
] as const;

export function AppShell({ active = "dashboard", children, userEmail }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#11120d] text-[#fffbf4]">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-[#56544966] bg-[#15160f] px-5 py-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between lg:block">
            <Link
              href="/dashboard"
              className="font-mono text-sm font-bold text-[#d8cfbc]"
            >
              MotionCode
            </Link>
            <div className="flex items-center gap-2 lg:block">
              {userEmail ? (
                <SignOutButton
                  className="border-[#56544966] text-[#b8af9d] hover:border-[#d8cfbc66] hover:text-[#fffbf4] lg:hidden"
                  label="Sign out"
                />
              ) : null}
              <Link
                href="/onboarding"
                className="inline-flex size-8 items-center justify-center border border-[#d8cfbc66] text-[#d8cfbc] lg:mt-8"
                title="New workspace"
              >
                <Plus className="size-4" />
              </Link>
            </div>
          </div>

          <nav className="mt-5 flex gap-2 lg:flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 border px-3 text-sm text-[#b8af9d] transition",
                    isActive
                      ? "border-[#d8cfbc] bg-[#d8cfbc1f] text-[#fffbf4]"
                      : "border-transparent hover:border-[#56544966] hover:text-[#fffbf4]",
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {userEmail ? (
            <div className="mt-8 hidden border-t border-[#56544966] pt-4 lg:block">
              <div className="break-all text-xs text-[#8f887a]">{userEmail}</div>
              <SignOutButton className="mt-4 w-full border-[#56544966] text-[#b8af9d] hover:border-[#d8cfbc66] hover:text-[#fffbf4]" />
            </div>
          ) : null}
        </aside>

        <main className="min-w-0 px-5 py-6 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
