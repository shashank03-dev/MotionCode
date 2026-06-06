import Link from "next/link";
import { ShieldCheck, Users, LifeBuoy } from "lucide-react";

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
            <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase text-[#8fd6ff]">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Internal Admin
            </div>
            <h1 className="text-3xl font-semibold text-[var(--text)]">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#b9c0ba]">
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
          ? "border-[#8fd6ff]/60 bg-[#8fd6ff]/12 text-[#e7f7ff]"
          : "border-[var(--border)] text-[#b9c0ba] hover:border-[#8fd6ff]/40 hover:text-[#e7f7ff]",
      ].join(" ")}
      href={href}
    >
      {children}
    </Link>
  );
}
