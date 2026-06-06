import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

import {
  getSupabasePublicConfig,
  type SupabasePublicConfig,
} from "./config";

export function getSupabaseBrowserConfig(): SupabasePublicConfig {
  return getSupabasePublicConfig();
}

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabaseBrowserConfig();

  return createBrowserClient<Database>(url, publishableKey);
}

export const createClient = createSupabaseBrowserClient;
