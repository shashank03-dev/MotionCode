import { Activity, LifeBuoy, Sparkles, Timer, Users } from "lucide-react";

import type { AdminDashboardDTO } from "@/lib/contracts/adminSupport";
import { AdminSupportTickets } from "@/components/admin/AdminSupportTickets";

type AdminDashboardProps = {
  currentAdminId: string;
  dashboard: AdminDashboardDTO;
};

export function AdminDashboard({
  currentAdminId,
  dashboard,
}: AdminDashboardProps) {
  const recentEarlyAccessSignups = dashboard.recentEarlyAccessSignups ?? [];

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard
          icon={<LifeBuoy className="size-4" aria-hidden="true" />}
          label="Open Tickets"
          value={dashboard.counts.openTickets}
        />
        <MetricCard
          icon={<Timer className="size-4" aria-hidden="true" />}
          label="Pending Tickets"
          value={dashboard.counts.pendingTickets}
        />
        <MetricCard
          icon={<Users className="size-4" aria-hidden="true" />}
          label="Users"
          value={dashboard.counts.users}
        />
        <MetricCard
          icon={<Sparkles className="size-4" aria-hidden="true" />}
          label="Early Access Requests"
          value={dashboard.counts.earlyAccessRequests}
        />
      </section>

      <AdminSupportTickets
        currentAdminId={currentAdminId}
        initialTickets={dashboard.recentTickets}
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg border border-[var(--border)] bg-[#151913]">
          <div className="border-b border-[var(--border)] p-4">
            <h2 className="text-lg font-semibold">Recent Users</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {dashboard.recentUsers.map((user) => (
              <div className="flex items-center justify-between gap-4 p-4" key={user.id}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--text)]">
                    {user.displayName ?? user.email}
                  </p>
                  <p className="truncate text-xs text-[#b9c0ba]">{user.email}</p>
                </div>
                <span className="rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[#d8e0dc]">
                  {user.planTier}
                </span>
              </div>
            ))}
            {dashboard.recentUsers.length === 0 ? (
              <div className="p-4 text-sm text-[#b9c0ba]">No users found.</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[#151913]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] p-4">
            <Activity className="size-4 text-[#8fd6ff]" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Recent Audit Events</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {dashboard.recentAuditEvents.map((event) => (
              <div className="grid gap-1 p-4 text-sm" key={event.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[#8fd6ff]">
                    {event.eventType}
                  </span>
                  <span className="text-xs text-[#b9c0ba]">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
                <p className="truncate text-xs text-[#b9c0ba]">
                  {event.targetType ?? "system"} {event.targetId ?? ""}
                </p>
              </div>
            ))}
            {dashboard.recentAuditEvents.length === 0 ? (
              <div className="p-4 text-sm text-[#b9c0ba]">No audit events yet.</div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[#151913]">
        <div className="flex items-center gap-2 border-b border-[var(--border)] p-4">
          <Sparkles className="size-4 text-[#8fd6ff]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">Recent Early Access</h2>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {recentEarlyAccessSignups.map((signup) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
              key={`${signup.userId}-${signup.desiredPlan}`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--text)]">
                  {signup.email ?? signup.userId}
                </p>
                <p className="font-mono text-xs uppercase text-[#8fd6ff]">
                  {signup.desiredPlan} / {signup.status}
                </p>
              </div>
              <span className="text-xs text-[#b9c0ba]">
                {formatDate(signup.createdAt)}
              </span>
            </div>
          ))}
          {recentEarlyAccessSignups.length === 0 ? (
            <div className="p-4 text-sm text-[#b9c0ba]">
              No early access requests yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[#151913] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-[#b9c0ba]">
        <span className="text-[#8fd6ff]">{icon}</span>
        {label}
      </div>
      <div className="text-3xl font-semibold text-[var(--text)]">{value}</div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
