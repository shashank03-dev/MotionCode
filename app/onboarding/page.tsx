import { AppShell } from "@/components/dashboard/app-shell";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";

import { requireDashboardUser } from "../dashboard/data";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireDashboardUser("/onboarding");

  return (
    <AppShell userEmail={user.email}>
      <div className="mx-auto max-w-2xl py-10">
        <div className="border border-[var(--border)] bg-[#15160f]/82 p-6 shadow-[0_18px_44px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Onboarding
          </p>
          <h1 className="font-mono text-3xl text-[var(--text)]">
            Create a workspace
          </h1>
          <OnboardingForm />
        </div>
      </div>
    </AppShell>
  );
}
