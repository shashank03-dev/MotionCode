import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, afterEach } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
  vi.restoreAllMocks();
  vi.doUnmock("@/lib/supabase/server");
  vi.doUnmock("@/lib/server/entitlements");
  vi.doUnmock("next/navigation");
});

describe("auth callback route", () => {
  it("exchanges a callback code, ensures a profile, and redirects to the requested path", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";

    const exchangeCodeForSession = vi.fn(async () => ({
      data: { session: { access_token: "token" } },
      error: null,
    }));
    const getUser = vi.fn(async () => ({
      data: {
        user: {
          email: "founder@example.com",
          id: "user_123",
          user_metadata: { full_name: "Founder" },
        },
      },
      error: null,
    }));
    const ensureProfileForUser = vi.fn(async () => undefined);
    vi.doMock("@/lib/supabase/server", () => ({
      createSupabaseServerClient: () => ({
        auth: { exchangeCodeForSession, getUser },
      }),
    }));
    vi.doMock("@/lib/server/profiles", () => ({
      ensureProfileForUser,
    }));

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://motioncode.test/auth/callback?code=oauth-code&next=/dashboard",
      ),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(getUser).toHaveBeenCalledOnce();
    expect(ensureProfileForUser).toHaveBeenCalledWith({
      email: "founder@example.com",
      id: "user_123",
      user_metadata: { full_name: "Founder" },
    });
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://motioncode.test/dashboard",
    );
  });

  it("rejects unsafe callback next values", async () => {
    const exchangeCodeForSession = vi.fn(async () => ({
      data: { session: { access_token: "token" } },
      error: null,
    }));
    const getUser = vi.fn(async () => ({
      data: { user: { email: "founder@example.com", id: "user_123" } },
      error: null,
    }));
    vi.doMock("@/lib/supabase/server", () => ({
      createSupabaseServerClient: () => ({
        auth: { exchangeCodeForSession, getUser },
      }),
    }));
    vi.doMock("@/lib/server/profiles", () => ({
      ensureProfileForUser: vi.fn(async () => undefined),
    }));

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://motioncode.test/auth/callback?code=oauth-code&next=https://evil.test/dashboard",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://motioncode.test/dashboard",
    );
  });

  it("redirects safely when the callback code is missing", async () => {
    const observeAuthError = vi.fn(async () => undefined);
    vi.doMock("@/lib/server/observability", () => ({
      observeAuthError,
    }));

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request("https://motioncode.test/auth/callback?next=/dashboard"),
    );

    expect(observeAuthError).toHaveBeenCalledWith({
      action: "callback",
      reason: "missing_code",
      route: "/auth/callback",
    });
    expect(response.headers.get("location")).toBe(
      "https://motioncode.test/login?auth=callback-error",
    );
  });

  it("redirects safely when profile bootstrap fails", async () => {
    const exchangeCodeForSession = vi.fn(async () => ({
      data: { session: { access_token: "token" } },
      error: null,
    }));
    const getUser = vi.fn(async () => ({
      data: { user: { email: "founder@example.com", id: "user_123" } },
      error: null,
    }));
    const observeAuthError = vi.fn(async () => undefined);
    vi.doMock("@/lib/supabase/server", () => ({
      createSupabaseServerClient: () => ({
        auth: { exchangeCodeForSession, getUser },
      }),
    }));
    vi.doMock("@/lib/server/profiles", () => ({
      ensureProfileForUser: vi.fn(async () => {
        throw new Error("profile insert failed");
      }),
    }));
    vi.doMock("@/lib/server/observability", () => ({
      observeAuthError,
    }));

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request(
        "https://motioncode.test/auth/callback?code=oauth-code&next=/dashboard",
      ),
    );

    expect(observeAuthError).toHaveBeenCalledWith({
      action: "callback",
      reason: "profile_bootstrap_failed",
      route: "/auth/callback",
    });
    expect(response.headers.get("location")).toBe(
      "https://motioncode.test/login?auth=callback-error",
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

  it("preserves non-default protected routes when redirecting to login", async () => {
    const redirect = vi.fn((path: string) => {
      throw new Error(`redirect:${path}`);
    });
    vi.doMock("next/navigation", () => ({ redirect }));
    vi.doMock("@/lib/supabase/server", () => ({
      createSupabaseServerClient: () => ({}),
      getCurrentUser: vi.fn(async () => null),
    }));

    const { requireDashboardUser } = await import("@/app/dashboard/data");

    await expect(
      requireDashboardUser("/workspaces/workspace_123"),
    ).rejects.toThrow("redirect:/login?next=%2Fworkspaces%2Fworkspace_123");
    expect(redirect).toHaveBeenCalledWith(
      "/login?next=%2Fworkspaces%2Fworkspace_123",
    );
  });
});

describe("account page paid plans status", () => {
  it("shows Razorpay upgrade guidance instead of signup queue requests", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      getCurrentUser: vi.fn(async () => ({
        email: "founder@example.com",
        id: "user_123",
      })),
    }));
    vi.doMock("@/lib/server/entitlements", () => ({
      getEntitlementSummary: vi.fn(async () => ({
        entitlements: {
          auditLogRetentionDays: 7,
          dailyAnalyses: 1,
          maxFramesPerAnalysis: 6,
          maxUploadBytes: 25 * 1024 * 1024,
          savedProjects: 5,
          teamSeats: 1,
        },
        planTier: "free",
        profile: {
          display_name: "Founder",
          email: "founder@example.com",
        },
        subscription: null,
        usage: {
          dailyAnalyses: {
            limit: 1,
            used: 1,
          },
        },
      })),
    }));
    const { default: AccountPage } = await import("@/app/account/page");
    const renderedHtml = renderToStaticMarkup(
      await AccountPage({ searchParams: Promise.resolve({}) }),
    );

    expect(renderedHtml).toContain("Upgrade");
    expect(renderedHtml).toContain("Razorpay Checkout");
    expect(renderedHtml).toContain("View paid plans");
    expect(renderedHtml).not.toContain("Early access");
  });
});
