import type { Metadata } from "next";

import { SiteFooter, SiteHeader } from "@/components/marketing";
import { SupportAccessState } from "@/components/support/SupportAccessState";
import { SupportCenter } from "@/components/support/SupportCenter";
import { Eyebrow } from "@/components/ui/kit";
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

export default async function SupportPage() {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return (
      <div className="min-h-dvh bg-canvas text-ink">
        <SiteHeader />
        <SupportHero />
        <div className="container-page py-14">
          <SupportAccessState />
        </div>
        <SiteFooter />
      </div>
    );
  }

  const tickets = await listOwnSupportTickets(supabase, user.id);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <SiteHeader />
      <SupportHero />
      <div className="container-page py-14">
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
    <section className="relative border-b border-hairline">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-60" aria-hidden="true" />
      <div className="container-page relative py-10 sm:py-20">
        <Eyebrow dot>Support</Eyebrow>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-medium leading-[1.05] tracking-tightest text-balance sm:text-5xl">
          Account-scoped help for MotionCode.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-ink-2 text-pretty">
          Create a ticket, include the affected workspace or project, and keep the
          thread tied to your signed-in account.
        </p>
      </div>
    </section>
  );
}
