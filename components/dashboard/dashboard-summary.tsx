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
            className="border border-[#56544966] bg-[#15160f] px-4 py-4"
          >
            <div className="flex items-center justify-between text-[#8f887a]">
              <span className="text-xs uppercase tracking-[0.18em]">
                {metric.label}
              </span>
              <Icon className="size-4" />
            </div>
            <div className="mt-5 font-mono text-3xl text-[#fffbf4]">
              {metric.value}
            </div>
          </div>
        );
      })}
    </section>
  );
}
