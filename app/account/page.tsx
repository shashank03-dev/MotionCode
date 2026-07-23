import { ArrowUpRight, CreditCard } from "lucide-react";

import { AccountContent } from "@/components/account/AccountContent";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppBackground } from "@/components/ui/app-background";
import { EmptyState, PageHeader, Panel } from "@/components/ui/kit";
import { ButtonLink } from "@/components/ui/site-button";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AccountPageProps = {
  searchParams?: Promise<{
    billing?: string;
    request?: string;
  }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="relative min-h-screen bg-canvas px-4 py-16 text-ink sm:px-6">
        <AppBackground />
        <div className="relative z-10 mx-auto max-w-xl">
          <EmptyState
            title="Sign in required"
            description="Account settings are available after authentication."
            action={
              <ButtonLink href="/app" variant="primary" size="md">
                Open app
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            }
          />
        </div>
      </main>
    );
  }

  const notices = (
    <>
      {resolvedSearchParams?.request ? (
        <Panel
          variant="hairline"
          inset="none"
          radius="xl"
          className="border-l-2 border-l-accent px-4 py-3 text-[14px] text-ink"
        >
          Request received.
        </Panel>
      ) : null}

      {resolvedSearchParams?.billing === "razorpay" ? (
        <Panel
          variant="hairline"
          inset="none"
          radius="xl"
          className="border-l-2 border-l-accent px-4 py-3 text-[14px] text-ink"
        >
          Manage your Razorpay subscription from the Billing page.
        </Panel>
      ) : null}
    </>
  );

  return (
    <main className="relative min-h-screen bg-canvas px-4 py-10 text-ink sm:px-6 lg:px-8">
      <AppBackground />
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-9">
        <PageHeader
          eyebrow="Account"
          title="Your profile, plan, and data."
          description="Review what your plan unlocks, manage billing, and control your data."
          actions={
            <>
              <ButtonLink href="/pricing" variant="ghost" size="sm">
                Plans
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/billing" variant="frosted" size="sm">
                <CreditCard className="size-4" aria-hidden="true" />
                Billing
              </ButtonLink>
              <SignOutButton className="h-9 rounded-full border-hairline px-4 text-[13px] text-ink-2 hover:border-accent-border hover:text-ink" />
            </>
          }
        />

        <AccountContent notices={notices} />
      </div>
    </main>
  );
}
