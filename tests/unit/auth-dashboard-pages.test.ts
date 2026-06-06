import { describe, expect, it, vi, afterEach } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
  vi.restoreAllMocks();
  vi.doUnmock("@/lib/supabase/server");
  vi.doUnmock("next/navigation");
});

describe("auth callback route", () => {
  it("exchanges a callback code for a session and redirects to the requested path", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

    const exchangeCodeForSession = vi.fn(async () => ({
      data: { session: { access_token: "token" } },
      error: null,
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      createSupabaseServerClient: () => ({
        auth: { exchangeCodeForSession },
      }),
    }));

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://motioncode.test/auth/callback?code=oauth-code&next=/dashboard",
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://motioncode.test/dashboard",
    );
  });
});

describe("dashboard page route protection", () => {
  it("redirects anonymous visitors to login", async () => {
    const redirect = vi.fn((path: string) => {
      throw new Error(`redirect:${path}`);
    });
    vi.doMock("next/navigation", () => ({ redirect }));
    vi.doMock("@/lib/supabase/server", () => ({
      createSupabaseServerClient: () => ({}),
      getCurrentUser: vi.fn(async () => null),
    }));

    const { default: DashboardPage } = await import("@/app/dashboard/page");

    await expect(DashboardPage()).rejects.toThrow("redirect:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
