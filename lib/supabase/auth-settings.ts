import type { SupabasePublicConfig } from "./config";

export type ExternalAuthProvider = "google";

type ExternalProviderSetting =
  | boolean
  | {
      enabled?: boolean;
    };

export type SupabaseAuthSettings = {
  external?: Record<string, ExternalProviderSetting | undefined>;
};

export async function getSupabaseAuthSettings(
  config: SupabasePublicConfig = getSupabaseBrowserAuthSettingsConfig(),
): Promise<SupabaseAuthSettings> {
  const response = await fetch(buildAuthSettingsUrl(config.url), {
    cache: "no-store",
    headers: {
      apikey: config.publishableKey,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to read Supabase Auth settings");
  }

  return (await response.json()) as SupabaseAuthSettings;
}

function getSupabaseBrowserAuthSettingsConfig(): SupabasePublicConfig {
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

export async function isSupabaseExternalProviderEnabled(
  provider: ExternalAuthProvider,
  config?: SupabasePublicConfig,
) {
  return isExternalAuthProviderEnabled(
    await getSupabaseAuthSettings(config),
    provider,
  );
}

export function isExternalAuthProviderEnabled(
  settings: SupabaseAuthSettings,
  provider: ExternalAuthProvider,
) {
  const value = settings.external?.[provider];

  if (typeof value === "boolean") {
    return value;
  }

  return value?.enabled === true;
}

function buildAuthSettingsUrl(url: string) {
  return `${url.replace(/\/+$/, "")}/auth/v1/settings`;
}
