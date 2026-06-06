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

export default async function SupportPage() {
  const supabase = createSupabaseServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#10120d] text-[#fffbf4]">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <SupportAccessState />
        </main>
        <SiteFooter />
      </div>
    );
  }

  const tickets = await listOwnSupportTickets(supabase, user.id);

  return (
    <div className="min-h-screen bg-[#10120d] text-[#fffbf4]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <SupportCenter
          initialTickets={tickets}
          userEmail={user.email ?? "your account"}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
