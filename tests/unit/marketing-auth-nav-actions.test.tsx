import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type MockUser = {
  email?: string | null;
};

const getUser = vi.fn<
  () => Promise<{ data: { user: MockUser | null }; error: null }>
>();
const unsubscribe = vi.fn();
let authChangeCallback:
  | ((event: string, session: { user: MockUser | null } | null) => void)
  | null = null;

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      getUser,
      onAuthStateChange: (
        callback: (event: string, session: { user: MockUser | null } | null) => void,
      ) => {
        authChangeCallback = callback;
        return {
          data: {
            subscription: {
              unsubscribe,
            },
          },
        };
      },
    },
  }),
}));

describe("MarketingAuthNavActions", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    getUser.mockReset();
    unsubscribe.mockReset();
    authChangeCallback = null;
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("replaces landing sign-in and try-free actions after a user is present", async () => {
    getUser.mockResolvedValue({
      data: { user: { email: "founder@motioncode.ai" } },
      error: null,
    });

    const { MarketingAuthNavActions } = await import(
      "@/components/marketing/auth-nav-actions"
    );

    await act(async () => {
      root.render(<MarketingAuthNavActions variant="landing" />);
    });
    await flushEffects();

    expect(container.textContent).toContain("Dashboard");
    expect(container.textContent).toContain("Open App");
    expect(container.textContent).toContain("founder@motioncode.ai");
    expect(container.textContent).toContain("Out");
    expect(container.textContent).not.toContain("Sign in");
    expect(container.textContent).not.toContain("Try Free");
  });

  it("updates the shared site header when auth state changes after mount", async () => {
    const { MarketingAuthNavActions } = await import(
      "@/components/marketing/auth-nav-actions"
    );

    await act(async () => {
      root.render(<MarketingAuthNavActions variant="site" />);
    });
    await flushEffects();

    expect(container.textContent).toContain("Try Free");

    await act(async () => {
      authChangeCallback?.("SIGNED_IN", {
        user: { email: "team@motioncode.ai" },
      });
    });

    expect(container.textContent).toContain("Dashboard");
    expect(container.textContent).toContain("Account");
    expect(container.textContent).toContain("Open App");
    expect(container.textContent).toContain("Out");
    expect(container.textContent).not.toContain("Try Free");
  });
});

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}
