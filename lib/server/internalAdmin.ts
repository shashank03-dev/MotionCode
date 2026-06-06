import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { AppErrorCode } from "@/lib/contracts/errors";
import { ApiError } from "@/lib/server/apiErrors";
import { createSupabaseAdminClient } from "@/lib/server/supabaseAdmin";
import { getCurrentUser } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type InternalAdminProfile = Pick<
  ProfileRow,
  | "created_at"
  | "display_name"
  | "email"
  | "id"
  | "is_internal_admin"
  | "plan_tier"
  | "updated_at"
>;

export type InternalAdminContext = {
  adminClient: SupabaseClient<Database>;
  allowlisted: boolean;
  profile: InternalAdminProfile | null;
  user: User;
};

export type InternalAdminDenied = {
  code: Extract<AppErrorCode, "FORBIDDEN" | "UNAUTHENTICATED">;
  message: string;
  ok: false;
};

export type InternalAdminDecision =
  | { context: InternalAdminContext; ok: true }
  | InternalAdminDenied;

type InternalAdminDeps = {
  adminClient?: SupabaseClient<Database>;
  env?: NodeJS.ProcessEnv;
  getCurrentUser?: () => Promise<User | null>;
};

const ADMIN_PROFILE_COLUMNS =
  "id,email,display_name,plan_tier,is_internal_admin,created_at,updated_at";

export async function resolveInternalAdminContext(
  deps: InternalAdminDeps = {},
): Promise<InternalAdminDecision> {
  const user = await (deps.getCurrentUser ?? getCurrentUser)();
  if (!user) {
    return {
      code: "UNAUTHENTICATED",
      message: "Sign in with an internal admin account.",
      ok: false,
    };
  }

  const adminClient = deps.adminClient ?? createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .select(ADMIN_PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Failed to verify admin access.");
  }

  const profile = data as InternalAdminProfile | null;
  const allowlisted = isAllowlistedInternalAdmin({
    env: deps.env,
    profile,
    user,
  });

  if (!profile?.is_internal_admin && !allowlisted) {
    return {
      code: "FORBIDDEN",
      message: "Internal admin access is required.",
      ok: false,
    };
  }

  return {
    context: {
      adminClient,
      allowlisted,
      profile,
      user,
    },
    ok: true,
  };
}

export function isAllowlistedInternalAdmin({
  env = process.env,
  profile,
  user,
}: {
  env?: NodeJS.ProcessEnv;
  profile: Pick<ProfileRow, "email" | "id"> | null;
  user: Pick<User, "email" | "id">;
}) {
  const allowedEmails = parseAllowlist(env.MOTIONCODE_INTERNAL_ADMIN_EMAILS).map(
    (email) => email.toLowerCase(),
  );
  const allowedUserIds = parseAllowlist(env.MOTIONCODE_INTERNAL_ADMIN_USER_IDS);
  const email = (profile?.email ?? user.email ?? "").toLowerCase();

  return (
    (email.length > 0 && allowedEmails.includes(email)) ||
    allowedUserIds.includes(user.id) ||
    allowedUserIds.includes(profile?.id ?? "")
  );
}

function parseAllowlist(value: string | undefined) {
  return (value ?? "")
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}
