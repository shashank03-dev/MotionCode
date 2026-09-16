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
    expect(container.textContent).not.toContain("Sign in");
    expect(container.textContent).not.toContain("Try Free");

    // The account entry point is a dropdown trigger; the email and sign-out
    // action live inside the menu, which renders into a portal once opened.
    const accountTrigger = container.querySelector<HTMLButtonElement>(
      'button[aria-haspopup="menu"]',
    );
    expect(accountTrigger).not.toBeNull();
    expect(accountTrigger?.getAttribute("aria-label")).toContain(
      "founder@motioncode.ai",
    );

    await act(async () => {
      accountTrigger?.click();
    });

    expect(document.body.textContent).toContain("Signed in as");
    expect(document.body.textContent).toContain("founder@motioncode.ai");
    expect(document.body.textContent).toContain("Sign out");
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
    expect(container.textContent).toContain("Sign out");
    expect(container.textContent).not.toContain("Try Free");
  });

  it("calls onNavigate when a menu link is clicked", async () => {
    getUser.mockResolvedValue({
      data: { user: { email: "menu@motioncode.ai" } },
      error: null,
    });
    const { MarketingAuthNavActions } = await import(
      "@/components/marketing/auth-nav-actions"
    );
    const onNavigate = vi.fn();

    await act(async () => {
      root.render(
        <MarketingAuthNavActions
          variant="site"
          layout="menu"
          onNavigate={onNavigate}
        />,
      );
    });
    await flushEffects();

    const dashboard = container.querySelector('a[href="/dashboard"]');
    expect(dashboard).not.toBeNull();
    await act(async () => {
      (dashboard as HTMLAnchorElement).click();
    });

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("opens sign-out confirm without calling onNavigate", async () => {
    getUser.mockResolvedValue({
      data: { user: { email: "menu@motioncode.ai" } },
      error: null,
    });
    const { MarketingAuthNavActions } = await import(
      "@/components/marketing/auth-nav-actions"
    );
    const onNavigate = vi.fn();

    await act(async () => {
      root.render(
        <MarketingAuthNavActions
          variant="site"
          layout="menu"
          onNavigate={onNavigate}
        />,
      );
    });
    await flushEffects();

    const signOut = Array.from(container.querySelectorAll("button")).find(
      (candidate) => candidate.textContent?.includes("Sign out"),
    );
    expect(signOut).not.toBeUndefined();
    await act(async () => {
      (signOut as HTMLButtonElement).click();
    });

    expect(document.body.textContent).toContain("Sign out of MotionCode?");
    expect(onNavigate).not.toHaveBeenCalled();
  });
});

async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}
