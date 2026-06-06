import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { Database } from "@/types/database";

const SupabaseAdminConfigSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type SupabaseAdminConfig = {
  supabaseServiceRoleKey: string;
  supabaseUrl: string;
};

export function getSupabaseAdminConfig(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseAdminConfig {
  const parsed = SupabaseAdminConfigSchema.safeParse(env);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const key = issue?.path.join(".") || "Supabase admin config";
    throw new Error(`Invalid ${key}: ${issue?.message ?? "unknown error"}`);
  }

  return {
    supabaseServiceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
  };
}

export function createSupabaseAdminClient(
  config: SupabaseAdminConfig = getSupabaseAdminConfig(),
): SupabaseClient<Database> {
  return createClient<Database>(
    config.supabaseUrl,
    config.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
