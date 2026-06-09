import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it, vi, afterEach } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
  vi.restoreAllMocks();
  vi.doUnmock("@/lib/supabase/server");
  vi.doUnmock("@/lib/server/entitlements");
  vi.doUnmock("@/lib/server/earlyAccessAdmin");
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

describe("account page early access status", () => {
  it("shows the signed-in user's early access requests", async () => {
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
          dailyAnalyses: 3,
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
            limit: 3,
            used: 1,
          },
        },
      })),
    }));
    vi.doMock("@/lib/server/earlyAccessAdmin", () => ({
      getEarlyAccessForUser: vi.fn(async () => [
        {
          createdAt: "2026-06-08T12:00:00.000Z",
          desiredPlan: "pro",
          status: "requested",
        },
      ]),
    }));

    const { default: AccountPage } = await import("@/app/account/page");
    const renderedHtml = renderToStaticMarkup(
      await AccountPage({ searchParams: Promise.resolve({}) }),
    );

    expect(renderedHtml).toContain("Early access");
    expect(renderedHtml).toContain("Pro");
    expect(renderedHtml).toContain("Requested");
  });
});

describe("admin dashboard early access metric", () => {
  it("shows early access request volume", async () => {
    const { AdminDashboard } = await import("@/components/admin/AdminDashboard");
    const renderedHtml = renderToStaticMarkup(
      createElement(AdminDashboard, {
        currentAdminId: "admin_123",
        dashboard: {
          counts: {
            earlyAccessRequests: 4,
            openTickets: 1,
            pendingTickets: 2,
            users: 3,
          },
          recentAuditEvents: [],
          recentTickets: [],
          recentUsers: [],
        } as never,
      }),
    );

    expect(renderedHtml).toContain("Early Access Requests");
    expect(renderedHtml).toContain("4");
  });
});
