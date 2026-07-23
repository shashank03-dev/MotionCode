import { Plus } from "lucide-react";

import { CreateWorkspaceForm } from "@/components/workspace/create-workspace-form";
import { WorkspaceDesktop } from "@/components/workspace/workspace-desktop";
import { UpgradeGate } from "@/components/app/UpgradeGate";
import { PageHeader } from "@/components/ui/kit";
import { ButtonLink } from "@/components/ui/site-button";

import {
  getWorkspaceFolders,
  requireDashboardUser,
  resolvePlanGate,
} from "@/app/dashboard/data";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
  const user = await requireDashboardUser("/workspaces");
  const { isPaid } = await resolvePlanGate(user.id);
  if (!isPaid) {
    return <UpgradeGate feature="Workspaces" />;
  }
  const folders = await getWorkspaceFolders();

  return (
    <div className="mx-auto max-w-6xl space-y-9">
      <PageHeader
        eyebrow="Desktop"
        title="Your workspaces."
        description="Every folder is a workspace. Open one to browse its saved analyses — new runs are saved there automatically."
        actions={
          <ButtonLink href="#new-workspace" variant="primary" size="md">
            <Plus className="size-4" aria-hidden="true" />
            New workspace
          </ButtonLink>
        }
      />

      <div id="new-workspace">
        <CreateWorkspaceForm />
      </div>
      <WorkspaceDesktop folders={folders} />
    </div>
  );
}
