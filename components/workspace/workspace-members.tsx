import type { WorkspaceMemberRow } from "@/app/dashboard/data";

type WorkspaceMembersProps = {
  members: WorkspaceMemberRow[];
  ownerId: string;
};

export function WorkspaceMembers({ members, ownerId }: WorkspaceMembersProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-mono text-lg text-[#fffbf4]">Members</h2>
      <div className="divide-y divide-[#56544966] border border-[#56544966] bg-[#15160f]">
        <div className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto]">
          <div className="font-mono text-[#fffbf4]">{ownerId}</div>
          <div className="text-[#8f887a]">owner</div>
        </div>
        {members.map((member) => (
          <div
            key={member.id}
            className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto]"
          >
            <div className="font-mono text-[#fffbf4]">{member.user_id}</div>
            <div className="text-[#8f887a]">{member.role}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
