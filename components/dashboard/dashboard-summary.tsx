import { Activity, Boxes, FolderKanban } from "lucide-react";

import type { DashboardData } from "@/app/dashboard/data";

type DashboardSummaryProps = {
  data: DashboardData;
};

export function DashboardSummary({ data }: DashboardSummaryProps) {
  const analysisCount = data.usageEvents.filter((event) =>
    event.event_type.startsWith("analysis."),
  ).length;

  const metrics = [
    {
      icon: Boxes,
      label: "Workspaces",
      value: data.workspaces.length,
    },
    {
      icon: FolderKanban,
      label: "Projects",
      value: data.projects.length,
    },
    {
      icon: Activity,
      label: "Today",
      value: analysisCount,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Dashboard summary">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <div
            key={metric.label}
            className="group relative overflow-hidden border border-[var(--border)] bg-[#15160f]/82 px-4 py-4 shadow-[0_18px_44px_rgba(0,0,0,0.22)] transition hover:border-[var(--accent-border)]"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,255,136,0.055),transparent_42%)] opacity-0 transition group-hover:opacity-100"
              aria-hidden="true"
            />
            <div className="relative flex items-center justify-between text-[var(--muted)]">
              <span className="font-mono text-xs uppercase tracking-[0.16em]">
                {metric.label}
              </span>
              <Icon className="size-4 text-[var(--accent)]" />
            </div>
            <div className="relative mt-5 font-mono text-3xl text-[var(--text)] [font-variant-numeric:tabular-nums]">
              {metric.value}
            </div>
          </div>
        );
      })}
    </section>
  );
}
