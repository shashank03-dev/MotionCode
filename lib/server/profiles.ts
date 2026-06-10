import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { createSupabaseAdminClient } from "./supabaseAdmin";

type ProfileClient = Pick<SupabaseClient<Database>, "from">;

export async function ensureProfileForUser(
  user: User,
  client: ProfileClient = createSupabaseAdminClient(),
) {
  if (!user.email) {
    throw new Error("Cannot create profile without a verified email.");
  }

  const metadata = asRecord(user.user_metadata);
  const displayName = firstString(
    metadata.full_name,
    metadata.name,
    metadata.display_name,
  );
  const avatarUrl = firstString(metadata.avatar_url, metadata.picture);
  const profileValues: Database["public"]["Tables"]["profiles"]["Insert"] = {
    email: user.email,
    id: user.id,
  };

  if (displayName) {
    profileValues.display_name = displayName;
  }
  if (avatarUrl) {
    profileValues.avatar_url = avatarUrl;
  }

  const { error } = await client.from("profiles").upsert(
    profileValues,
    { onConflict: "id" },
  );

  if (error) {
    throw new Error("Failed to ensure authenticated user profile.");
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => {
    return typeof value === "string" && value.trim().length > 0;
  }) ?? null;
}
