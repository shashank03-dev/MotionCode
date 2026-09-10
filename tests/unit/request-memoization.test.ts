import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("request-scoped server memoization", () => {
  it("memoizes the current-user lookup through React cache", async () => {
    const getUser = vi.fn(async () => ({
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null,
    }));
    const createServerClient = vi.fn(async () => ({ auth: { getUser } }));
    const cachedFunctions: Array<(...args: never[]) => unknown> = [];
    vi.doMock("react", async () => {
      const actual = await vi.importActual<typeof import("react")>("react");
      return {
        ...actual,
        cache: <T extends (...args: never[]) => unknown>(fn: T) => {
          let promise: ReturnType<T> | undefined;
          const cached = ((...args: never[]) => {
            promise ??= fn(...args) as ReturnType<T>;
            return promise;
          }) as T;
          cachedFunctions.push(cached);
          return cached;
        },
      };
    });
    vi.doMock("@supabase/ssr", () => ({ createServerClient }));
    vi.doMock("@/lib/supabase/config", () => ({
      getSupabasePublicConfig: () => ({
        publishableKey: "test-anon-key",
        url: "https://example.supabase.co",
      }),
    }));
    vi.doMock("next/headers", () => ({
      cookies: vi.fn(async () => ({
        getAll: () => [],
        set: vi.fn(),
      })),
    }));

    const { getCurrentUserCached } = await import("@/lib/supabase/server");

    await expect(getCurrentUserCached()).resolves.toMatchObject({ id: "user-1" });
    await expect(getCurrentUserCached()).resolves.toMatchObject({ id: "user-1" });

    expect(cachedFunctions).toHaveLength(1);
    expect(getUser).toHaveBeenCalledOnce();
  });
});
