import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/account?auth=required");
  }

  redirect("/account?billing=razorpay");
}
