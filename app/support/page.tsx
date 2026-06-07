import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/marketing";
import { SupportAccessState } from "@/components/support/SupportAccessState";
import { SupportCenter } from "@/components/support/SupportCenter";
import { listOwnSupportTickets } from "@/lib/server/adminSupport";
import {
  createSupabaseServerClient,
  getCurrentUser,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Support | MotionCode",
  description:
    "Create support tickets and review account-scoped MotionCode support history.",
};

const supportThemeClass =
  "[&_main]:!min-h-0 [&_main]:!bg-transparent [&_main]:!px-0 [&_main]:!py-0 [&_section]:!rounded-none [&_section]:!border-[#1a1a1a] [&_section]:!bg-[#11120d] [&_input]:!rounded-none [&_input]:!border-[#1a1a1a] [&_input]:!bg-[#080808] [&_textarea]:!rounded-none [&_textarea]:!border-[#1a1a1a] [&_textarea]:!bg-[#080808] [&_button]:!rounded-none [&_button]:!border-[#00ff88]/50 [&_button]:!bg-[#00ff88]/10 [&_button]:!font-mono [&_button]:!text-[#fffbf4] [&_a]:!rounded-none [&_a]:!border-[#1a1a1a] [&_svg]:!text-[#00ff88] [&_.rounded-lg]:!rounded-none";

export default async function SupportPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#080808] text-[#fffbf4]">
        <SiteHeader />
        <SupportHero />
        <div className={`mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 ${supportThemeClass}`}>
          <SupportAccessState />
        </div>
        <SiteFooter />
      </div>
    );
  }

  const tickets = await listOwnSupportTickets(supabase, user.id);

  return (
    <div className="min-h-screen bg-[#080808] text-[#fffbf4]">
      <SiteHeader />
      <SupportHero />
      <div className={`mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 ${supportThemeClass}`}>
        <SupportCenter
          initialTickets={tickets}
          userEmail={user.email ?? "your account"}
        />
      </div>
      <SiteFooter />
    </div>
  );
}

function SupportHero() {
  return (
    <section className="border-b border-[#1a1a1a]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00ff88]">
          {"// support"}
        </p>
        <h1 className="mt-4 max-w-3xl font-mono text-4xl font-bold leading-tight sm:text-5xl">
          Account-scoped help for MotionCode.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-[#565449] sm:text-lg">
          Create a ticket, include the affected workspace or project, and keep
          the thread tied to your signed-in account.
        </p>
      </div>
    </section>
  );
}
