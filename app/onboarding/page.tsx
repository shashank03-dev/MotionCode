import { AppShell } from "@/components/dashboard/app-shell";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";

import { requireDashboardUser } from "../dashboard/data";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireDashboardUser();

  return (
    <AppShell userEmail={user.email}>
      <div className="mx-auto max-w-2xl py-10">
        <div className="border border-[#56544966] bg-[#15160f] p-6 sm:p-8">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#8f887a]">
            Onboarding
          </p>
          <h1 className="font-mono text-3xl text-[#fffbf4]">
            Create a workspace
          </h1>
          <OnboardingForm />
        </div>
      </div>
    </AppShell>
  );
}
