import { afterEach, describe, expect, it } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("server env loader", () => {
  it("returns only the server env values needed by API routes", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://motioncode.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    process.env.GEMINI_API_KEY = "server-gemini-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "server-only-placeholder";

    const { getServerEnv } = await import("@/lib/server/env");

    const env = getServerEnv();

    expect(env).toEqual({
      geminiApiKey: "server-gemini-key",
      supabasePublishableKey: "public-anon-key",
      supabaseUrl: "https://motioncode.supabase.co",
    });
    expect(JSON.stringify(env)).not.toContain("server-only-placeholder");
  });

  it("throws a clear error when the Gemini server key is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://motioncode.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    delete process.env.GEMINI_API_KEY;

    const { getServerEnv } = await import("@/lib/server/env");

    expect(() => getServerEnv()).toThrow("Missing GEMINI_API_KEY");
  });

  it("throws a clear error when Supabase public server config is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    process.env.GEMINI_API_KEY = "server-gemini-key";

    const { getServerEnv } = await import("@/lib/server/env");

    expect(() => getServerEnv()).toThrow("Missing NEXT_PUBLIC_SUPABASE_URL");
  });
});
