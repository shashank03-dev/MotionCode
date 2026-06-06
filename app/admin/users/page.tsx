import type { Metadata } from "next";

import { AdminAccessState } from "@/components/admin/AdminAccessState";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { listAdminUsers } from "@/lib/server/adminSupport";
import { resolveInternalAdminContext } from "@/lib/server/internalAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Users | MotionCode",
};

export default async function AdminUsersPage() {
  const decision = await resolveInternalAdminContext();
  if (!decision.ok) {
    return (
      <AdminAccessState
        message={decision.message}
        title={
          decision.code === "UNAUTHENTICATED"
            ? "Sign in required"
            : "Internal admin required"
        }
      />
    );
  }

  const users = await listAdminUsers(decision.context.adminClient);

  return (
    <AdminPageShell
      active="users"
      subtitle="Inspect user plans and apply support or billing plan overrides with a server-side audit event."
      title="Users And Plan Overrides"
    >
      <AdminUsersTable initialUsers={users} />
    </AdminPageShell>
  );
}
