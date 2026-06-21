"use client";

import { useState } from "react";
import { RefreshCw, Save, ShieldCheck } from "lucide-react";

import type {
  AdminPlanOverrideDTO,
  AdminUserDTO,
} from "@/lib/contracts/adminSupport";
import type { ApiResponse } from "@/lib/contracts/errors";
import { PLAN_TIERS, type PlanTier } from "@/lib/contracts/plans";

type AdminUsersTableProps = {
  initialUsers: AdminUserDTO[];
};

type OverrideDraft = {
  expiresAt: string;
  planTier: PlanTier;
  reason: string;
};

export function AdminUsersTable({ initialUsers }: AdminUsersTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [drafts, setDrafts] = useState<Record<string, OverrideDraft>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  function draftFor(user: AdminUserDTO): OverrideDraft {
    return (
      drafts[user.id] ?? {
        expiresAt: "",
        planTier: user.planTier,
        reason: "",
      }
    );
  }

  function updateDraft(user: AdminUserDTO, patch: Partial<OverrideDraft>) {
    setDrafts((current) => ({
      ...current,
      [user.id]: {
        ...draftFor(user),
        ...patch,
      },
    }));
  }

  async function submitOverride(user: AdminUserDTO) {
    const draft = draftFor(user);
    if (draft.reason.trim().length < 5) {
      setError("Plan override reason must be at least 5 characters.");
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmittingId(user.id);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/plan-override`, {
        body: JSON.stringify({
          expiresAt: draft.expiresAt
            ? new Date(draft.expiresAt).toISOString()
            : null,
          planTier: draft.planTier,
          reason: draft.reason.trim(),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as ApiResponse<{
        override: AdminPlanOverrideDTO;
      }>;

      if (!json.ok) {
        setError(json.message);
        return;
      }

      setUsers((current) =>
        current.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                latestOverride: json.data.override,
                planTier: json.data.override.planTier,
              }
            : currentUser,
        ),
      );
      setDrafts((current) => ({
        ...current,
        [user.id]: {
          expiresAt: "",
          planTier: json.data.override.planTier,
          reason: "",
        },
      }));
      setSuccess(`Plan override applied to ${user.email}.`);
    } catch {
      setError("Plan override failed.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[#151913]">
      <div className="flex flex-col gap-2 border-b border-[var(--border)] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Admin Users</h2>
          <p className="mt-1 text-sm text-[#d8cfbc]">
            Apply temporary or manual plan overrides with an audit trail.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          {error ? (
            <p className="rounded-lg border border-[#ff7a7a]/40 bg-[#ff7a7a]/10 px-3 py-2 text-[#ffd1d1]">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-lg border border-[#82e6a0]/40 bg-[#82e6a0]/10 px-3 py-2 text-[#d8ffe2]">
              {success}
            </p>
          ) : null}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
          <thead className="bg-[#0f140f] text-xs uppercase text-[#d8cfbc]">
            <tr>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Current Plan</th>
              <th className="px-4 py-3 font-medium">Latest Override</th>
              <th className="px-4 py-3 font-medium">Override Plan</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Expires</th>
              <th className="px-4 py-3 font-medium">Apply</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const draft = draftFor(user);
              const disabled = submittingId === user.id;

              return (
                <tr
                  className="border-t border-[var(--border)] align-top"
                  key={user.id}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      {user.isInternalAdmin ? (
                        <ShieldCheck
                          className="mt-0.5 size-4 text-[#00ff88]"
                          aria-label="Internal admin"
                        />
                      ) : null}
                      <div>
                        <div className="font-medium text-[var(--text)]">
                          {user.displayName ?? user.email}
                        </div>
                        <div className="text-xs text-[#d8cfbc]">{user.email}</div>
                        <div className="mt-1 font-mono text-xs text-[#737b75]">
                          {user.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <PlanPill tier={user.planTier} />
                  </td>
                  <td className="max-w-[260px] px-4 py-3 text-[#fffbf4]">
                    {user.latestOverride ? (
                      <div>
                        <PlanPill tier={user.latestOverride.planTier} />
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#d8cfbc]">
                          {user.latestOverride.reason}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[#d8cfbc]">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="h-8 rounded-lg border border-[var(--border)] bg-[#0f140f] px-2 text-sm text-[var(--text)]"
                      disabled={disabled}
                      onChange={(event) =>
                        updateDraft(user, {
                          planTier: event.target.value as PlanTier,
                        })
                      }
                      value={draft.planTier}
                    >
                      {PLAN_TIERS.map((tier) => (
                        <option key={tier} value={tier}>
                          {tier}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="h-8 w-64 rounded-lg border border-[var(--border)] bg-[#0f140f] px-2 text-sm text-[var(--text)] placeholder:text-[#737b75]"
                      disabled={disabled}
                      onChange={(event) =>
                        updateDraft(user, { reason: event.target.value })
                      }
                      placeholder="Support or billing reason"
                      value={draft.reason}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      className="h-8 w-48 rounded-lg border border-[var(--border)] bg-[#0f140f] px-2 text-sm text-[var(--text)]"
                      disabled={disabled}
                      onChange={(event) =>
                        updateDraft(user, { expiresAt: event.target.value })
                      }
                      type="datetime-local"
                      value={draft.expiresAt}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      aria-label={`Apply plan override for ${user.email}`}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-[var(--border)] text-[#fffbf4] hover:border-[#00ff88]/50 hover:text-[#00ff88] disabled:opacity-50"
                      disabled={disabled}
                      onClick={() => submitOverride(user)}
                      title="Apply override"
                      type="button"
                    >
                      {disabled ? (
                        <RefreshCw className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {users.length === 0 ? (
        <div className="p-6 text-sm text-[#d8cfbc]">No users found.</div>
      ) : null}
    </section>
  );
}

function PlanPill({ tier }: { tier: PlanTier }) {
  const tone =
    tier === "studio"
      ? "border-[#00ff88]/50 bg-[#00ff88]/12 text-[#fffbf4]"
      : tier === "pro"
        ? "border-[#82e6a0]/50 bg-[#82e6a0]/12 text-[#d8ffe2]"
        : "border-[var(--border)] bg-[#0f140f] text-[#fffbf4]";

  return (
    <span className={`inline-flex rounded-lg border px-2 py-1 text-xs ${tone}`}>
      {tier}
    </span>
  );
}
