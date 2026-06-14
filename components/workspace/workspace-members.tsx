import type { WorkspaceMemberRow } from "@/app/dashboard/data";

type WorkspaceMembersProps = {
  members: WorkspaceMemberRow[];
  ownerId: string;
};

export function WorkspaceMembers({ members, ownerId }: WorkspaceMembersProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-mono text-lg text-[var(--text)]">Members</h2>
      <div className="divide-y divide-[var(--border)] border border-[var(--border)] bg-[#15160f]/82 shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
        <div className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto]">
          <div>
            <div className="font-medium text-[var(--text)]">Workspace owner</div>
            <div className="mt-1 font-mono text-xs text-[var(--muted)]">
              {formatMemberId(ownerId)}
            </div>
          </div>
          <div className="font-mono text-xs text-[var(--accent)]">owner</div>
        </div>
        {members.map((member) => (
          <div
            key={member.id}
            className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto]"
          >
            <div>
              <div className="font-medium text-[var(--text)]">
                Workspace member
              </div>
              <div className="mt-1 font-mono text-xs text-[var(--muted)]">
                {formatMemberId(member.user_id)}
              </div>
            </div>
            <div className="font-mono text-xs text-[var(--accent)]">
              {member.role}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatMemberId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}
