import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export function SupportAccessState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 text-[var(--text)]">
      <section className="w-full max-w-lg rounded-lg border border-[var(--border)] bg-[#151913] p-6">
        <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-[#00ff88]/12 text-[#00ff88]">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold">Sign in required</h1>
        <p className="mt-3 text-sm leading-6 text-[#d8cfbc]">
          MotionCode support tickets are available after Supabase authentication
          verifies your account.
        </p>
        <Link
          className="mt-6 inline-flex h-9 items-center rounded-lg border border-[var(--border)] px-3 text-sm text-[#fffbf4] hover:border-[#00ff88]/50"
          href="/"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
