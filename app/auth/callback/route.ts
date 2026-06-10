import { NextResponse } from "next/server";

import { normalizeAuthNextPath } from "@/lib/auth/redirects";
import { observeAuthError } from "@/lib/server/observability";
import { ensureProfileForUser } from "@/lib/server/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    await observeAuthError({
      action: "callback",
      reason: "missing_code",
      route: "/auth/callback",
    });

    return redirectToCallbackError(request);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    await observeAuthError({
      action: "callback",
      reason: "exchange_failed",
      route: "/auth/callback",
    });

    return redirectToCallbackError(request);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await observeAuthError({
      action: "callback",
      reason: "user_lookup_failed",
      route: "/auth/callback",
    });

    return redirectToCallbackError(request);
  }

  try {
    await ensureProfileForUser(user);
  } catch {
    await observeAuthError({
      action: "callback",
      reason: "profile_bootstrap_failed",
      route: "/auth/callback",
    });

    return redirectToCallbackError(request);
  }

  return NextResponse.redirect(new URL(next, request.url));
}

function normalizeNextPath(value: string | null) {
  return normalizeAuthNextPath(value);
}

function redirectToCallbackError(request: Request) {
  return NextResponse.redirect(
    new URL("/login?auth=callback-error", request.url),
  );
}
