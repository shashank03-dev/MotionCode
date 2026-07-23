import { Activity, Boxes, FolderKanban } from "lucide-react";

import type { DashboardData } from "@/app/dashboard/data";
import { Panel } from "@/components/ui/kit";

type DashboardSummaryProps = {
  data: DashboardData;
};

export function DashboardSummary({ data }: DashboardSummaryProps) {
  const analysisCount = data.usageEvents.filter((event) =>
    event.event_type.startsWith("analysis."),
  ).length;

  const metrics = [
    { icon: Boxes, label: "Workspaces", value: data.workspaces.length },
    { icon: FolderKanban, label: "Projects", value: data.projects.length },
    { icon: Activity, label: "Analyses today", value: analysisCount },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-3" aria-label="Dashboard summary">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <Panel
            key={metric.label}
            variant="glass"
            inset="none"
            radius="xl"
            interactive
            className="group p-5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-3">
                {metric.label}
              </span>
              <Icon className="size-4 text-ink-3 transition-colors group-hover:text-accent" />
            </div>
            <div className="mt-5 font-mono text-3xl leading-none tabular-nums text-ink">
              {metric.value}
            </div>
          </Panel>
        );
      })}
    </section>
  );
}
