"use client";

import { useMemo, useState } from "react";
import { RefreshCw, UserCheck, UserMinus } from "lucide-react";

import {
  SUPPORT_TICKET_PRIORITIES,
  SUPPORT_TICKET_STATUSES,
  type AdminSupportTicketDTO,
  type SupportTicketPriority,
  type SupportTicketStatus,
} from "@/lib/contracts/adminSupport";
import type { ApiResponse } from "@/lib/contracts/errors";

type AdminSupportTicketsProps = {
  currentAdminId: string;
  initialTickets: AdminSupportTicketDTO[];
};

export function AdminSupportTickets({
  currentAdminId,
  initialTickets,
}: AdminSupportTicketsProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const openCount = useMemo(
    () => tickets.filter((ticket) => ticket.status !== "closed").length,
    [tickets],
  );

  async function updateTicket(
    ticketId: string,
    payload: Partial<{
      assignedAdminId: string | null;
      priority: SupportTicketPriority;
      status: SupportTicketStatus;
    }>,
  ) {
    setError(null);
    setUpdatingId(ticketId);

    try {
      const response = await fetch(`/api/admin/support/${ticketId}`, {
        body: JSON.stringify(payload),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });
      const json = (await response.json()) as ApiResponse<{
        ticket: AdminSupportTicketDTO;
      }>;

      if (!json.ok) {
        setError(json.message);
        return;
      }

      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId ? json.data.ticket : ticket,
        ),
      );
    } catch {
      setError("Ticket update failed.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[#151913]">
      <div className="flex flex-col gap-2 border-b border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Support Queue</h2>
          <p className="mt-1 text-sm text-[#d8cfbc]">
            {openCount} active tickets across the visible queue.
          </p>
        </div>
        {error ? (
          <p className="rounded-lg border border-[#ff7a7a]/40 bg-[#ff7a7a]/10 px-3 py-2 text-sm text-[#ffd1d1]">
            {error}
          </p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead className="bg-[#0f140f] text-xs uppercase text-[#d8cfbc]">
            <tr>
              <th className="px-4 py-3 font-medium">Ticket</th>
              <th className="px-4 py-3 font-medium">Requester</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Assignee</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Assign</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const disabled = updatingId === ticket.id;
              return (
                <tr
                  className="border-t border-[var(--border)] align-top"
                  key={ticket.id}
                >
                  <td className="max-w-[320px] px-4 py-3">
                    <div className="font-medium text-[var(--text)]">
                      {ticket.subject}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#d8cfbc]">
                      {ticket.body}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[#fffbf4]">
                    <ProfileLabel
                      fallbackId={ticket.userId}
                      profile={ticket.requester}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="h-8 rounded-lg border border-[var(--border)] bg-[#0f140f] px-2 text-sm text-[var(--text)]"
                      disabled={disabled}
                      onChange={(event) =>
                        updateTicket(ticket.id, {
                          status: event.target.value as SupportTicketStatus,
                        })
                      }
                      value={ticket.status}
                    >
                      {SUPPORT_TICKET_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="h-8 rounded-lg border border-[var(--border)] bg-[#0f140f] px-2 text-sm text-[var(--text)]"
                      disabled={disabled}
                      onChange={(event) =>
                        updateTicket(ticket.id, {
                          priority: event.target.value as SupportTicketPriority,
                        })
                      }
                      value={ticket.priority}
                    >
                      {SUPPORT_TICKET_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[#fffbf4]">
                    {ticket.assignee ? (
                      <ProfileLabel
                        fallbackId={ticket.assignedAdminId ?? ""}
                        profile={ticket.assignee}
                      />
                    ) : (
                      <span className="text-[#d8cfbc]">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#d8cfbc]">
                    {formatDate(ticket.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        aria-label="Assign ticket to me"
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-[var(--border)] text-[#fffbf4] hover:border-[#00ff88]/50 hover:text-[#00ff88] disabled:opacity-50"
                        disabled={disabled}
                        onClick={() =>
                          updateTicket(ticket.id, {
                            assignedAdminId: currentAdminId,
                          })
                        }
                        title="Assign to me"
                        type="button"
                      >
                        {disabled ? (
                          <RefreshCw className="size-4 animate-spin" />
                        ) : (
                          <UserCheck className="size-4" />
                        )}
                      </button>
                      <button
                        aria-label="Unassign ticket"
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-[var(--border)] text-[#fffbf4] hover:border-[#00ff88]/50 hover:text-[#00ff88] disabled:opacity-50"
                        disabled={disabled}
                        onClick={() =>
                          updateTicket(ticket.id, { assignedAdminId: null })
                        }
                        title="Unassign"
                        type="button"
                      >
                        <UserMinus className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tickets.length === 0 ? (
        <div className="p-6 text-sm text-[#d8cfbc]">No support tickets yet.</div>
      ) : null}
    </section>
  );
}

function ProfileLabel({
  fallbackId,
  profile,
}: {
  fallbackId: string;
  profile: { displayName: string | null; email: string } | null;
}) {
  if (!profile) {
    return <span className="font-mono text-xs">{fallbackId}</span>;
  }

  return (
    <span>
      {profile.displayName ? `${profile.displayName} ` : ""}
      <span className="text-[#d8cfbc]">{profile.email}</span>
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
