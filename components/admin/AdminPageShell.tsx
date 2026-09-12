import Link from "next/link";
import { ShieldCheck, Users, LifeBuoy } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppBackground } from "@/components/ui/app-background";
import { Eyebrow, Pill } from "@/components/ui/kit";
import { cn } from "@/lib/utils";

type AdminPageShellProps = {
  active: "dashboard" | "users";
  children: React.ReactNode;
  subtitle: string;
  title: string;
};

export function AdminPageShell({
  active,
  children,
  subtitle,
  title,
}: AdminPageShellProps) {
  return (
    <main className="relative min-h-dvh bg-canvas px-4 py-10 text-ink sm:px-6 lg:px-8">
      <AppBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="grid gap-5 border-b border-hairline pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2.5">
              <Eyebrow>Internal admin</Eyebrow>
              <Pill tone="accent">
                <ShieldCheck className="size-3" aria-hidden="true" />
                restricted
              </Pill>
            </div>
            <h1 className="mt-3 font-display text-3xl font-medium leading-[1.05] tracking-tightest text-ink sm:text-[2.6rem]">
              {title}
            </h1>
            <p className="mt-3.5 max-w-2xl text-[15px] leading-7 text-ink-2 text-pretty">
              {subtitle}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            <AdminNavLink active={active === "dashboard"} href="/admin">
              <LifeBuoy className="size-4" aria-hidden="true" />
              Support
            </AdminNavLink>
            <AdminNavLink active={active === "users"} href="/admin/users">
              <Users className="size-4" aria-hidden="true" />
              Users
            </AdminNavLink>
            <SignOutButton className="h-11 min-h-[44px] rounded-full border-hairline px-4 text-[13px] text-ink-2 hover:border-accent-border hover:text-ink" />
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}

function AdminNavLink({
  active,
  children,
  href,
}: {
  active: boolean;
  children: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      className={cn(
        "inline-flex h-11 min-h-[44px] items-center gap-2 rounded-full border px-4 text-[13px] transition-colors",
        active
          ? "border-accent-border bg-accent-dim font-medium text-ink"
          : "border-hairline text-ink-2 hover:border-accent-border hover:text-ink",
      )}
      href={href}
    >
      {children}
    </Link>
  );
}
