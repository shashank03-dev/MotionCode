import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.doUnmock("@/lib/supabase/server");
});

describe("auth sign-out route", () => {
  it("signs out only the current browser session and redirects to login", async () => {
    const signOut = vi.fn(async () => ({ error: null }));
    vi.doMock("@/lib/supabase/server", () => ({
      createSupabaseServerClient: async () => ({
        auth: { signOut },
      }),
    }));

    const { POST } = await import("@/app/auth/signout/route");
    const response = await POST(
      new Request("https://motioncode.test/auth/signout", {
        method: "POST",
      }),
    );

    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://motioncode.test/login?signedOut=1",
    );
  });

  it("does not show a success state when local sign-out fails", async () => {
    const signOut = vi.fn(async () => ({ error: new Error("sign out failed") }));
    vi.doMock("@/lib/supabase/server", () => ({
      createSupabaseServerClient: async () => ({
        auth: { signOut },
      }),
    }));

    const { POST } = await import("@/app/auth/signout/route");
    const response = await POST(
      new Request("https://motioncode.test/auth/signout", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://motioncode.test/login?auth=signout-error",
    );
  });
});
