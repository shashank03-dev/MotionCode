import { AppShell as AnalyzeWorkspace } from "@/components/app/AppShell";
import { AppShell as WorkspaceShell } from "@/components/dashboard/app-shell";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnimationConverter() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <WorkspaceShell active="analyze" bleed userEmail={null}>
        <AnalyzeWorkspace />
      </WorkspaceShell>
    );
  }

  const summary = await getEntitlementSummary(user.id);

  return (
    <WorkspaceShell
      active="analyze"
      bleed
      planTier={summary.planTier}
      userEmail={user.email}
      userId={user.id}
    >
      <AnalyzeWorkspace
        initialDailyAnalysisUsage={summary.usage.dailyAnalyses}
        initialEntitlements={summary.entitlements}
        initialPlanTier={summary.planTier}
      />
    </WorkspaceShell>
  );
}
