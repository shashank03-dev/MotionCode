import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
  vi.restoreAllMocks();
  vi.doUnmock("@supabase/ssr");
});

describe("Supabase auth helpers", () => {
  it("builds the browser client configuration from public env vars only", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-secret";

    const { getSupabaseBrowserConfig } = await import(
      "@/lib/supabase/browser"
    );

    const config = getSupabaseBrowserConfig();

    expect(config).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "public-anon-key",
    });
    expect(JSON.stringify(config)).not.toContain("service-role-secret");
  });

  it("uses auth.getUser for verified current user lookups", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user_123", email: "user@example.com" } },
      error: null,
    });
    const { getCurrentUser } = await import("@/lib/supabase/server");

    await expect(
      getCurrentUser({ auth: { getUser } } as never),
    ).resolves.toEqual({
      id: "user_123",
      email: "user@example.com",
    });
    expect(getUser).toHaveBeenCalledOnce();
  });

  it("returns null when Supabase cannot verify a current user", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: new Error("Auth session missing"),
    });
    const { getCurrentUser } = await import("@/lib/supabase/server");

    await expect(
      getCurrentUser({ auth: { getUser } } as never),
    ).resolves.toBeNull();
  });

  it("refreshes middleware sessions and persists Supabase auth cookies", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

    const getUser = vi.fn(async () => ({
      data: { user: null },
      error: null,
    }));
    const createServerClient = vi.fn((_url, _key, options) => {
      options.cookies.setAll([
        {
          name: "sb-example-auth-token",
          value: "refreshed",
          options: { path: "/", sameSite: "lax" },
        },
      ]);

      return { auth: { getUser } };
    });
    vi.doMock("@supabase/ssr", () => ({ createServerClient }));

    const { middleware, config } = await import("@/middleware");
    const request = new NextRequest("https://motioncode.test/app", {
      headers: { cookie: "sb-existing-auth-token=old" },
    });

    const response = await middleware(request);

    expect(createServerClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "public-anon-key",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      }),
    );
    expect(getUser).toHaveBeenCalledOnce();
    expect(response.cookies.get("sb-example-auth-token")?.value).toBe(
      "refreshed",
    );
    expect(config.matcher).toEqual([
      "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ]);
  });
});
