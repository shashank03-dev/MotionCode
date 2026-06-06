import type { Metadata } from "next";

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
};

export default async function SupportPage() {
  const supabase = createSupabaseServerClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return <SupportAccessState />;
  }

  const tickets = await listOwnSupportTickets(supabase, user.id);

  return (
    <SupportCenter
      initialTickets={tickets}
      userEmail={user.email ?? "your account"}
    />
  );
}
