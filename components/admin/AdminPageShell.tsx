import Link from "next/link";
import { ShieldCheck, Users, LifeBuoy } from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";

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
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase text-[#00ff88]">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Internal Admin
            </div>
            <h1 className="text-3xl font-semibold text-[var(--text)]">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#d8cfbc]">
              {subtitle}
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <AdminNavLink active={active === "dashboard"} href="/admin">
              <LifeBuoy className="size-4" aria-hidden="true" />
              Support
            </AdminNavLink>
            <AdminNavLink active={active === "users"} href="/admin/users">
              <Users className="size-4" aria-hidden="true" />
              Users
            </AdminNavLink>
            <SignOutButton className="border-[var(--border)] text-[#d8cfbc] hover:border-[#00ff88]/40 hover:text-[#fffbf4]" />
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
      className={[
        "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition",
        active
          ? "border-[#00ff88]/60 bg-[#00ff88]/12 text-[#fffbf4]"
          : "border-[var(--border)] text-[#d8cfbc] hover:border-[#00ff88]/40 hover:text-[#fffbf4]",
      ].join(" ")}
      href={href}
    >
      {children}
    </Link>
  );
}
