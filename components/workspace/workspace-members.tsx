import { UserRound } from "lucide-react";

import type { WorkspaceMemberRow } from "@/app/dashboard/data";
import { Panel, Pill, SectionLabel } from "@/components/ui/kit";

type WorkspaceMembersProps = {
  members: WorkspaceMemberRow[];
  ownerId: string;
};

export function WorkspaceMembers({ members, ownerId }: WorkspaceMembersProps) {
  return (
    <section className="space-y-4">
      <SectionLabel>Members</SectionLabel>
      <Panel
        variant="glass"
        inset="none"
        radius="2xl"
        className="divide-y divide-hairline overflow-hidden"
      >
        <MemberRow label="Workspace owner" id={ownerId} role="owner" isOwner />
        {members.map((member) => (
          <MemberRow
            key={member.id}
            label="Workspace member"
            id={member.user_id}
            role={member.role}
          />
        ))}
      </Panel>
    </section>
  );
}

function MemberRow({
  label,
  id,
  role,
  isOwner = false,
}: {
  label: string;
  id: string;
  role: string;
  isOwner?: boolean;
}) {
  return (
    <div className="grid gap-2 px-5 py-3.5 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="flex items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-hairline bg-white/[0.03] text-ink-3">
          <UserRound className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium text-ink">{label}</div>
          <div className="mt-0.5 truncate font-mono text-xs text-ink-3">
            {formatMemberId(id)}
          </div>
        </div>
      </div>
      <Pill tone={isOwner ? "accent" : "neutral"}>{role}</Pill>
    </div>
  );
}

function formatMemberId(value: string) {
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value;
}
