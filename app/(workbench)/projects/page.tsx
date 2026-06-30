import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/dashboard/app-shell";
import { RecentProjects } from "@/components/dashboard/recent-projects";

import { getDashboardData, requireDashboardUser } from "../dashboard/data";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const user = await requireDashboardUser("/projects");
  const data = await getDashboardData(user);

  return (
    <AppShell active="projects" userEmail={user.email}>
      <div className="space-y-7">
        <header className="grid gap-5 border-b border-[var(--border)] pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Project index
            </p>
            <h1 className="mt-3 max-w-3xl font-mono text-3xl leading-tight text-[var(--text)] sm:text-4xl">
              Saved motion work, ready to continue.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--accent)]">
              Open recent analysis projects, review source status, or start a fresh
              motion pass in the analyzer.
            </p>
          </div>
          <Link
            href="/app"
            className="inline-flex h-10 items-center justify-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-mono text-sm text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Analyze motion
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </header>

        <RecentProjects projects={data.projects} />
      </div>
    </AppShell>
  );
}
