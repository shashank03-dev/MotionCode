import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import { BillingContent } from "@/components/billing/BillingContent";
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
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/account"
              className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              Account
            </Link>
            <h1 className="mt-3 font-mono text-4xl">Billing</h1>
          </div>
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border)] px-4 font-sans text-sm text-[var(--accent)] transition hover:border-[var(--accent-border)] hover:text-[var(--text)]"
            href="/pricing"
          >
            View plans
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </header>

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
