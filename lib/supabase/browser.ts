import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import type { SupabasePublicConfig } from "./config";

export function getSupabaseBrowserConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!publishableKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { url, publishableKey };
}

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabaseBrowserConfig();

  return createBrowserClient<Database>(url, publishableKey);
}

export const createClient = createSupabaseBrowserClient;
