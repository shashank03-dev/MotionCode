import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getOptionalSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

// These routes are fully static and have no server-side user state. Skipping
// the Supabase refresh here keeps the CDN-cached HTML on the fast path instead
// of adding an auth network round-trip to every public page request.
const PUBLIC_STATIC_PATHS = new Set([
  "/",
  "/contact",
  "/privacy",
  "/refunds",
  "/shipping",
  "/terms",
]);

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (PUBLIC_STATIC_PATHS.has(request.nextUrl.pathname)) {
    return supabaseResponse;
  }

  const supabaseConfig = getOptionalSupabasePublicConfig();

  if (!supabaseConfig) {
    return supabaseResponse;
  }

  const { url, publishableKey } = supabaseConfig;
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers = {}) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([name, value]) => {
          supabaseResponse.headers.set(name, value);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
