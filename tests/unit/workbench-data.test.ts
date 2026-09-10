import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
  vi.restoreAllMocks();
});

function createQuery<T>(data: T) {
  const result = { data, error: null };
  const query = {
    eq: vi.fn(() => query),
    gte: vi.fn(() => query),
    limit: vi.fn(async () => result),
    maybeSingle: vi.fn(async () => result),
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    then: (
      resolve: (value: typeof result) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };

  return query;
}

describe("workbench data loading", () => {
  it("keeps dashboard profile and usage reads while the workbench only loads tree tables", async () => {
    const from = vi.fn((table: string) => {
      if (table === "profiles") {
        return createQuery({ id: "user-1" });
      }
      if (table === "usage_events") {
        return createQuery([]);
      }
      if (table === "workspaces") {
        return createQuery([]);
      }
      if (table === "projects") {
        return createQuery([]);
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    const createSupabaseServerClient = vi.fn(async () => ({ from }));
    vi.doMock("@/lib/supabase/server", () => ({
      createSupabaseServerClient,
    }));

    const { getDashboardData, getWorkbenchTreeData } = await import(
      "@/app/dashboard/data"
    );

    await getDashboardData({ id: "user-1" });
    expect(from.mock.calls.map(([table]) => table)).toEqual([
      "profiles",
      "workspaces",
      "projects",
      "usage_events",
    ]);

    from.mockClear();
    await getWorkbenchTreeData({ id: "user-1" });
    expect(from.mock.calls.map(([table]) => table)).toEqual([
      "workspaces",
      "projects",
    ]);
    expect(from).not.toHaveBeenCalledWith("profiles");
    expect(from).not.toHaveBeenCalledWith("usage_events");
  });
});
