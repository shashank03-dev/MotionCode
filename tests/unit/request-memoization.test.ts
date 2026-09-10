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

  it("memoizes the entitlement summary per user through React cache", async () => {
    const rowsByTable: Record<string, Array<Record<string, unknown>>> = {
      admin_plan_overrides: [],
      profiles: [
        { id: "user-1", plan_tier: "free" },
        { id: "user-2", plan_tier: "free" },
      ],
      subscriptions: [],
      usage_events: [],
    };
    const from = vi.fn((table: string) => {
      const rows = rowsByTable[table] ?? [];
      const filters: Array<(row: Record<string, unknown>) => boolean> = [];
      const query = {
        eq: (column: string, value: unknown) => {
          filters.push((row) => row[column] === value);
          return query;
        },
        gte: async () => ({ count: 0, data: [], error: null }),
        limit: async (count: number) => ({
          data: rows.filter((row) => filters.every((fn) => fn(row))).slice(0, count),
          error: null,
        }),
        order: () => query,
        select: () => query,
      };
      return query;
    });
    const cachedFunctions: Array<(...args: never[]) => unknown> = [];
    vi.doMock("react", async () => {
      const actual = await vi.importActual<typeof import("react")>("react");
      return {
        ...actual,
        cache: <T extends (...args: never[]) => unknown>(fn: T) => {
          const byKey = new Map<string, ReturnType<T>>();
          const cached = ((...args: never[]) => {
            const key = JSON.stringify(args);
            if (!byKey.has(key)) {
              byKey.set(key, fn(...args) as ReturnType<T>);
            }
            return byKey.get(key);
          }) as T;
          cachedFunctions.push(cached);
          return cached;
        },
      };
    });
    vi.doMock("@/lib/server/audit", () => ({
      createTrustedSupabaseServerClient: () => ({ from }),
    }));

    const { getEntitlementSummaryCached } = await import(
      "@/lib/server/entitlements"
    );

    // Importing the entitlements module also evaluates sibling server modules
    // that wrap their own helpers, so the count covers every module-level
    // cache() call, not just the entitlement summary wrapper.
    const wrappedAtImport = cachedFunctions.length;
    expect(wrappedAtImport).toBeGreaterThanOrEqual(1);

    const first = await getEntitlementSummaryCached("user-1");
    const second = await getEntitlementSummaryCached("user-1");

    expect(second).toEqual(first);
    // One miss reads profile + override + subscription + two daily-usage counts.
    expect(from).toHaveBeenCalledTimes(5);

    const otherUser = await getEntitlementSummaryCached("user-2");

    expect(otherUser.profile).toMatchObject({ id: "user-2" });
    expect(first.profile).toMatchObject({ id: "user-1" });
    expect(from).toHaveBeenCalledTimes(10);

    expect(cachedFunctions).toHaveLength(wrappedAtImport);
  });
});
