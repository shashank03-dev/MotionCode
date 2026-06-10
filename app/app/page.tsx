import { AppShell } from "@/components/app/AppShell";
import { getEntitlementSummary } from "@/lib/server/entitlements";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AnimationConverter() {
  const user = await getCurrentUser();

  if (!user) {
    return <AppShell />;
  }

  const summary = await getEntitlementSummary(user.id);

  return (
    <AppShell
      initialDailyAnalysisUsage={summary.usage.dailyAnalyses}
      initialEntitlements={summary.entitlements}
      initialPlanTier={summary.planTier}
    />
  );
}
