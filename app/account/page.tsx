import Link from "next/link";
import { ArrowUpRight, CreditCard } from "lucide-react";

import { AccountContent } from "@/components/account/AccountContent";
import { SignOutButton } from "@/components/auth/sign-out-button";
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
      <main className="min-h-screen bg-[var(--bg)] px-6 py-10 text-[var(--text)]">
        <div className="mx-auto max-w-3xl rounded-xl border border-[var(--border)] bg-[#15160f] p-8 shadow-[inset_0_1px_0_rgba(255,251,244,0.04)]">
          <p className="font-mono text-xs uppercase text-[var(--muted)]">
            Account
          </p>
          <h1 className="mt-3 font-mono text-3xl">Sign in required</h1>
          <p className="mt-4 max-w-xl font-sans text-sm leading-6 text-[var(--accent)]">
            Account settings are available after authentication.
          </p>
          <Link
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-md border border-[var(--accent-border)] px-4 font-sans text-sm text-[var(--text)] transition hover:border-[var(--accent)]"
            href="/app"
          >
            Open app
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
    );
  }

  const notices = (
    <>
      {resolvedSearchParams?.request ? (
        <div className="border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 py-3 font-sans text-sm text-[var(--text)]">
          Request received.
        </div>
      ) : null}

      {resolvedSearchParams?.billing === "razorpay" ? (
        <div className="border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 py-3 font-sans text-sm text-[var(--text)]">
          Manage your Razorpay subscription from the Billing page.
        </div>
      ) : null}
    </>
  );

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              MotionCode
            </Link>
            <h1 className="mt-3 font-mono text-4xl">Account</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border)] px-4 font-sans text-sm text-[var(--accent)] transition hover:border-[var(--accent-border)] hover:text-[var(--text)]"
              href="/pricing"
            >
              Plans
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-sans text-sm text-[var(--text)] transition hover:border-[var(--accent)] hover:bg-[#00ff88]/10"
              href="/billing"
            >
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              Billing
            </Link>
            <SignOutButton className="h-10 rounded-md border-[var(--border)] px-4 font-sans text-[var(--accent)] hover:border-[var(--accent-border)] hover:text-[var(--text)]" />
          </div>
        </header>

        <AccountContent notices={notices} />
      </div>
    </main>
  );
}
