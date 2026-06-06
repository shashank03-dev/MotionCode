import type { Metadata } from "next";

import { AdminAccessState } from "@/components/admin/AdminAccessState";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { getAdminDashboard } from "@/lib/server/adminSupport";
import { resolveInternalAdminContext } from "@/lib/server/internalAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Support | MotionCode",
};

export default async function AdminPage() {
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

  const dashboard = await getAdminDashboard(decision.context.adminClient);

  return (
    <AdminPageShell
      active="dashboard"
      subtitle="Review support ticket volume, handle the operator queue, and inspect recent audit events."
      title="Support Operations"
    >
      <AdminDashboard
        currentAdminId={decision.context.user.id}
        dashboard={dashboard}
      />
    </AdminPageShell>
  );
}
