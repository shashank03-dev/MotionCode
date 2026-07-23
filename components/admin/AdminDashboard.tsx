import { Activity, Users } from "lucide-react";

import type { AdminDashboardDTO } from "@/lib/contracts/adminSupport";
import { AdminSupportTickets } from "@/components/admin/AdminSupportTickets";
import { Panel, Pill, StatTile } from "@/components/ui/kit";

type AdminDashboardProps = {
  currentAdminId: string;
  dashboard: AdminDashboardDTO;
};

export function AdminDashboard({
  currentAdminId,
  dashboard,
}: AdminDashboardProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-3 md:grid-cols-3">
        <StatTile
          label="Open tickets"
          value={dashboard.counts.openTickets}
          accent
        />
        <StatTile label="Pending tickets" value={dashboard.counts.pendingTickets} />
        <StatTile label="Users" value={dashboard.counts.users} />
      </section>

      <AdminSupportTickets
        currentAdminId={currentAdminId}
        initialTickets={dashboard.recentTickets}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Panel variant="glass" inset="none" radius="2xl" className="overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-hairline p-5">
            <Users className="size-4 text-ink-3" aria-hidden="true" />
            <h2 className="font-display text-[15px] font-medium tracking-tight text-ink">
              Recent users
            </h2>
          </div>
          <div className="divide-y divide-hairline">
            {dashboard.recentUsers.map((user) => (
              <div
                className="flex items-center justify-between gap-4 px-5 py-3.5"
                key={user.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {user.displayName ?? user.email}
                  </p>
                  <p className="truncate font-mono text-xs text-ink-3">
                    {user.email}
                  </p>
                </div>
                <Pill tone="neutral">{user.planTier}</Pill>
              </div>
            ))}
            {dashboard.recentUsers.length === 0 ? (
              <div className="px-5 py-4 text-sm text-ink-2">No users found.</div>
            ) : null}
          </div>
        </Panel>

        <Panel variant="glass" inset="none" radius="2xl" className="overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-hairline p-5">
            <Activity className="size-4 text-ink-3" aria-hidden="true" />
            <h2 className="font-display text-[15px] font-medium tracking-tight text-ink">
              Recent audit events
            </h2>
          </div>
          <div className="divide-y divide-hairline">
            {dashboard.recentAuditEvents.map((event) => (
              <div className="grid gap-1.5 px-5 py-3.5" key={event.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-ink">
                    {event.eventType}
                  </span>
                  <span className="font-mono text-[11px] text-ink-3">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
                <p className="truncate font-mono text-[11px] text-ink-3">
                  {event.targetType ?? "system"} {event.targetId ?? ""}
                </p>
              </div>
            ))}
            {dashboard.recentAuditEvents.length === 0 ? (
              <div className="px-5 py-4 text-sm text-ink-2">
                No audit events yet.
              </div>
            ) : null}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
