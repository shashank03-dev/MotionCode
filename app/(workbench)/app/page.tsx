import { AppShell as AnalyzeWorkspace } from "@/components/app/AppShell";
import { AppShell as WorkspaceShell } from "@/components/dashboard/app-shell";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AnimationConverterProps = {
  searchParams: Promise<{ project?: string; ws?: string }>;
};

/**
 * The analyzer. Signed-in users get the workbench shell from the (workbench)
 * layout; anonymous visitors fall through that layout bare, so they keep the
 * standalone shell here. `?ws=` / `?project=` carry the save destination from
 * "New analysis" / "New sequence" buttons in the workspace desktop.
 */
export default async function AnimationConverter({
  searchParams,
}: AnimationConverterProps) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <WorkspaceShell active="analyze" bleed userEmail={null}>
        <AnalyzeWorkspace />
      </WorkspaceShell>
    );
  }

  const [summary, params] = await Promise.all([
    getEntitlementSummary(user.id),
    searchParams,
  ]);

  return (
    <AnalyzeWorkspace
      initialDailyAnalysisUsage={summary.usage.dailyAnalyses}
      initialEntitlements={summary.entitlements}
      initialPlanTier={summary.planTier}
      saveTarget={{
        projectId: sanitizeResourceId(params.project),
        workspaceId: sanitizeResourceId(params.ws),
      }}
    />
  );
}

function sanitizeResourceId(value: string | undefined) {
  return value && UUID_PATTERN.test(value) ? value : null;
}
