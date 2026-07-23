import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { BillingContent } from "@/components/billing/BillingContent";
import { AppBackground } from "@/components/ui/app-background";
import { PageHeader } from "@/components/ui/kit";
import { ButtonLink } from "@/components/ui/site-button";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BillingPageProps = {
  searchParams?: Promise<{
    plan?: string;
    subscription?: string;
  }>;
};

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/account?auth=required");
  }

  const resolvedSearchParams = await searchParams;
  const notice = resolveNotice(resolvedSearchParams);

  return (
    <main className="relative min-h-screen bg-canvas px-4 py-10 text-ink sm:px-6 lg:px-8">
      <AppBackground />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col gap-9">
        <PageHeader
          eyebrow="Account · Billing"
          title="Billing"
          description="Your current plan, subscription controls, and payment history."
          actions={
            <ButtonLink href="/pricing" variant="frosted" size="sm">
              View plans
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          }
        />

        <BillingContent notice={notice} />
      </div>
    </main>
  );
}

function resolveNotice(
  params: { plan?: string; subscription?: string } | undefined,
) {
  if (params?.subscription === "canceled") {
    return "Cancellation scheduled. You keep paid access until your renewal date.";
  }
  if (params?.plan === "upgraded") {
    return "Plan upgraded. Your new plan is active now.";
  }
  if (params?.plan === "scheduled") {
    return "Plan change scheduled for the end of your current billing cycle.";
  }
  return null;
}
