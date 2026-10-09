import type { Metadata } from "next";

import { PageHero } from "@/components/chrono/page-hero";
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
    <div className="min-h-dvh bg-canvas text-ink">
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
    <PageHero
      kicker="Support"
      title={
        <>
          Account-scoped help for <span className="serif-em">MotionCode.</span>
        </>
      }
      lede="Create a ticket, include the affected workspace or project, and keep the thread tied to your signed-in account."
    />
  );
}
