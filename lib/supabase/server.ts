import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import * as React from "react";

import type { Database } from "@/types/database";

import { getSupabasePublicConfig } from "./config";

type SupabaseAuthReader = {
  auth: Pick<SupabaseClient<Database>["auth"], "getUser">;
};

type ReactServerCache = <Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
) => (...args: Args) => Result;

// React 18's browser/test runtime does not expose the Server Components cache,
// while Next's server condition does. Keep the fallback for unit-test imports;
// production Server Components use React's request-scoped cache.
const requestCache =
  (React as typeof React & { cache?: ReactServerCache }).cache ??
  ((fn: ReactServerCache) => fn);

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

export const getCurrentUserCached = requestCache(async () => getCurrentUser());
