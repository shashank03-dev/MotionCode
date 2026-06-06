import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

import { getSupabasePublicConfig } from "./config";

type SupabaseAuthReader = {
  auth: Pick<SupabaseClient<Database>["auth"], "getUser">;
};

export async function createSupabaseServerClient() {
  const { url, publishableKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot mutate cookies. Middleware persists
          // refreshed auth cookies before rendering reaches this helper.
        }

        void headers;
      },
    },
  });
}

export const createClient = createSupabaseServerClient;

export async function getCurrentUser(
  supabase?: SupabaseAuthReader,
): Promise<User | null> {
  const client = supabase ?? (await createSupabaseServerClient());
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
