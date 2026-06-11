import { NextRequest } from "next/server";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import type { Database } from "@/types/database";

type PublicTable<Name extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][Name];

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
  vi.restoreAllMocks();
  vi.doUnmock("@supabase/ssr");
});

describe("Supabase auth helpers", () => {
  it("reads Supabase external provider settings across Auth response shapes", async () => {
    const { isExternalAuthProviderEnabled } = await import(
      "@/lib/supabase/auth-settings"
    );

    expect(
      isExternalAuthProviderEnabled({ external: { google: true } }, "google"),
    ).toBe(true);
    expect(
      isExternalAuthProviderEnabled(
        { external: { google: { enabled: true } } },
        "google",
      ),
    ).toBe(true);
    expect(
      isExternalAuthProviderEnabled(
        { external: { google: { enabled: false } } },
        "google",
      ),
    ).toBe(false);
    expect(isExternalAuthProviderEnabled({ external: {} }, "google")).toBe(
      false,
    );
  });

  it("fetches public Supabase Auth settings with the anon key", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ external: { google: { enabled: true } } }),
        {
          headers: { "content-type": "application/json" },
          status: 200,
        },
      ),
    );

    const { getSupabaseAuthSettings } = await import(
      "@/lib/supabase/auth-settings"
    );

    await expect(getSupabaseAuthSettings()).resolves.toEqual({
      external: { google: { enabled: true } },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/auth/v1/settings",
      expect.objectContaining({
        cache: "no-store",
        headers: { apikey: "public-anon-key" },
      }),
    );
  });

  it("does not rely on the shared server-style env helper for browser auth settings", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    vi.doMock("@/lib/supabase/config", async (importOriginal) => {
      const original =
        await importOriginal<typeof import("@/lib/supabase/config")>();
      return {
        ...original,
        getSupabasePublicConfig: () => {
          throw new Error("auth settings should use direct public env reads");
        },
      };
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ external: { google: { enabled: false } } }),
        {
          headers: { "content-type": "application/json" },
          status: 200,
        },
      ),
    );

    const { getSupabaseAuthSettings } = await import(
      "@/lib/supabase/auth-settings"
    );

    await expect(getSupabaseAuthSettings()).resolves.toEqual({
      external: { google: { enabled: false } },
    });
  });

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

  it("does not rely on the shared server-style env helper for browser config", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

    vi.doMock("@/lib/supabase/config", async (importOriginal) => {
      const original = await importOriginal<typeof import("@/lib/supabase/config")>();
      return {
        ...original,
        getSupabasePublicConfig: () => {
          throw new Error("browser config should use direct public env reads");
        },
      };
    });

    const { getSupabaseBrowserConfig } = await import(
      "@/lib/supabase/browser"
    );

    expect(getSupabaseBrowserConfig()).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "public-anon-key",
    });
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

    const { proxy, config } = await import("@/proxy");
    const request = new NextRequest("https://motioncode.test/app", {
      headers: { cookie: "sb-existing-auth-token=old" },
    });

    const response = await proxy(request);

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

  it("lets public routes render when Supabase public env is unavailable", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const createServerClient = vi.fn();
    vi.doMock("@supabase/ssr", () => ({ createServerClient }));

    const { proxy } = await import("@/proxy");
    const request = new NextRequest("https://motioncode.test/");

    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(createServerClient).not.toHaveBeenCalled();
  });
});

describe("Supabase generated-style public write types", () => {
  it("marks server-owned tables as unavailable for direct client writes", () => {
    expectTypeOf<PublicTable<"analyses">["Insert"]>().toEqualTypeOf<never>();
    expectTypeOf<PublicTable<"analyses">["Update"]>().toEqualTypeOf<never>();
    expectTypeOf<PublicTable<"generated_outputs">["Insert"]>().toEqualTypeOf<never>();
    expectTypeOf<PublicTable<"generated_outputs">["Update"]>().toEqualTypeOf<never>();
    expectTypeOf<PublicTable<"usage_events">["Insert"]>().toEqualTypeOf<never>();
    expectTypeOf<PublicTable<"usage_events">["Update"]>().toEqualTypeOf<never>();
    expectTypeOf<PublicTable<"share_links">["Insert"]>().toEqualTypeOf<never>();
    expectTypeOf<PublicTable<"share_links">["Update"]>().toEqualTypeOf<never>();
  });

  it("limits support ticket client writes to creation only", () => {
    expectTypeOf<PublicTable<"support_tickets">["Insert"]>().toEqualTypeOf<{
      user_id: string;
      subject: string;
      body: string;
    }>();
    expectTypeOf<PublicTable<"support_tickets">["Update"]>().toEqualTypeOf<never>();
  });
});
