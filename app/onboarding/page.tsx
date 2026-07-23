import { AppShell } from "@/components/dashboard/app-shell";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";
import { Eyebrow, Panel } from "@/components/ui/kit";
import { getEntitlementSummary } from "@/lib/server/entitlements";

import { requireDashboardUser } from "../dashboard/data";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireDashboardUser("/onboarding", { paidOnly: true });
  const summary = await getEntitlementSummary(user.id);

  return (
    <AppShell
      planTier={summary.planTier}
      userEmail={user.email}
      userId={user.id}
    >
      <div className="mx-auto max-w-2xl py-10">
        <Panel variant="glass" inset="lg" radius="2xl">
          <Eyebrow dot>Onboarding</Eyebrow>
          <h1 className="mt-3 font-display text-3xl font-medium leading-[1.05] tracking-tightest text-ink">
            Create a workspace
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-7 text-ink-2">
            Workspaces group your saved analyses. Every run you make lands in one
            automatically.
          </p>
          <OnboardingForm />
        </Panel>
      </div>
    </AppShell>
  );
}
