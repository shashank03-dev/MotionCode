import { z } from "zod";

const ServerEnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
});

export type ServerEnv = {
  geminiApiKey: string;
  supabasePublishableKey: string;
  supabaseUrl: string;
};

const REQUIRED_ENV_KEYS = [
  "GEMINI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
] as const;

export function getServerEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  for (const key of REQUIRED_ENV_KEYS) {
    if (!env[key]) {
      throw new Error(`Missing ${key}`);
    }
  }

  const parsed = ServerEnvSchema.safeParse(env);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const key = issue?.path.join(".") || "server env";
    throw new Error(`Invalid ${key}: ${issue?.message ?? "unknown error"}`);
  }

  return {
    geminiApiKey: parsed.data.GEMINI_API_KEY,
    supabasePublishableKey: parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrl: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
  };
}
