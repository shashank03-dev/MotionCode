import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    return NextResponse.redirect(
      new URL("/login?auth=signout-error", request.url),
      303,
    );
  }

  return NextResponse.redirect(new URL("/login?signedOut=1", request.url), 303);
}
