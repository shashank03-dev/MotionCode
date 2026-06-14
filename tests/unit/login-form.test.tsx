import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOAuth = vi.fn();
const signInWithOtp = vi.fn();
const isSupabaseExternalProviderEnabled = vi.fn();
const ORIGINAL_ENV = { ...process.env };

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithOAuth,
      signInWithOtp,
    },
  }),
}));

vi.mock("@/lib/supabase/auth-settings", () => ({
  isSupabaseExternalProviderEnabled,
}));

describe("LoginForm", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    signInWithOAuth.mockReset();
    signInWithOtp.mockReset();
    isSupabaseExternalProviderEnabled.mockReset();
    signInWithOAuth.mockResolvedValue({ error: null });
    signInWithOtp.mockResolvedValue({ error: null });
    isSupabaseExternalProviderEnabled.mockResolvedValue(true);

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    window.history.replaceState(null, "", "/login");
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("starts Google OAuth with the normalized callback destination", async () => {
    const { LoginForm } = await import("@/components/dashboard/login-form");

    await act(async () => {
      root.render(<LoginForm nextPath="/workspaces/workspace_123" />);
    });
    await settleProviderCheck();

    const button = findButton("Continue with Google");
    await act(async () => {
      button.click();
    });

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        queryParams: {
          prompt: "select_account",
        },
        redirectTo:
          `${window.location.origin}/auth/callback?next=%2Fworkspaces%2Fworkspace_123`,
      },
    });
  });

  it("defaults new authentication sessions into the app workspace", async () => {
    const { LoginForm } = await import("@/components/dashboard/login-form");

    await act(async () => {
      root.render(<LoginForm />);
    });
    await settleProviderCheck();

    const button = findButton("Continue with Google");
    await act(async () => {
      button.click();
    });

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        queryParams: {
          prompt: "select_account",
        },
        redirectTo: `${window.location.origin}/auth/callback?next=%2Fapp`,
      },
    });
  });

  it("keeps Google OAuth callbacks on localhost during local development", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://motioncode.com/";

    const { LoginForm } = await import("@/components/dashboard/login-form");

    await act(async () => {
      root.render(<LoginForm nextPath="/dashboard" />);
    });
    await settleProviderCheck();

    const button = findButton("Continue with Google");
    await act(async () => {
      button.click();
    });

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        queryParams: {
          prompt: "select_account",
        },
        redirectTo: `${window.location.origin}/auth/callback?next=%2Fdashboard`,
      },
    });
  });

  it("keeps magic-link auth using the same callback destination", async () => {
    const { LoginForm } = await import("@/components/dashboard/login-form");

    await act(async () => {
      root.render(<LoginForm nextPath="/projects/project_123" />);
    });
    await settleProviderCheck();

    const input = container.querySelector<HTMLInputElement>("#email");
    if (!input) {
      throw new Error("Expected email input.");
    }

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      valueSetter?.call(input, "founder@example.com");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const form = container.querySelector("form");
    if (!form) {
      throw new Error("Expected login form.");
    }

    await act(async () => {
      form.dispatchEvent(
        new SubmitEvent("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "founder@example.com",
      options: {
        emailRedirectTo:
          `${window.location.origin}/auth/callback?next=%2Fprojects%2Fproject_123`,
      },
    });
  });

  it("keeps magic-link callbacks on localhost during local development", async () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://motioncode.com";

    const { LoginForm } = await import("@/components/dashboard/login-form");

    await act(async () => {
      root.render(<LoginForm nextPath="/account" />);
    });
    await settleProviderCheck();

    const input = container.querySelector<HTMLInputElement>("#email");
    if (!input) {
      throw new Error("Expected email input.");
    }

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      valueSetter?.call(input, " Founder@Example.COM ");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });

    const form = container.querySelector("form");
    if (!form) {
      throw new Error("Expected login form.");
    }

    await act(async () => {
      form.dispatchEvent(
        new SubmitEvent("submit", { bubbles: true, cancelable: true }),
      );
    });

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "founder@example.com",
      options: {
        emailRedirectTo:
          `${window.location.origin}/auth/callback?next=%2Faccount`,
      },
    });
  });

  it("does not start Google OAuth when Supabase reports Google is disabled", async () => {
    isSupabaseExternalProviderEnabled.mockResolvedValue(false);

    const { LoginForm } = await import("@/components/dashboard/login-form");

    await act(async () => {
      root.render(<LoginForm nextPath="/dashboard" />);
    });
    await settleProviderCheck();

    const button = findButton("Continue with Google");
    expect(button.disabled).toBe(true);
    expect(container.textContent).toContain(
      "Google sign-in is not enabled for this Supabase project.",
    );
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it("does not start Google OAuth when Supabase Auth settings cannot be verified", async () => {
    isSupabaseExternalProviderEnabled.mockRejectedValue(
      new Error("settings unavailable"),
    );

    const { LoginForm } = await import("@/components/dashboard/login-form");

    await act(async () => {
      root.render(<LoginForm nextPath="/dashboard" />);
    });
    await settleProviderCheck();

    const button = findButton("Continue with Google");
    expect(button.disabled).toBe(true);
    expect(container.textContent).toContain(
      "Google sign-in cannot be verified right now.",
    );
    expect(signInWithOAuth).not.toHaveBeenCalled();
  });

  it("maps Supabase provider-disabled OAuth errors to an operator action", async () => {
    signInWithOAuth.mockResolvedValue({
      error: { message: "Unsupported provider: provider is not enabled" },
    });

    const { LoginForm } = await import("@/components/dashboard/login-form");

    await act(async () => {
      root.render(<LoginForm nextPath="/dashboard" />);
    });
    await settleProviderCheck();

    const button = findButton("Continue with Google");
    await act(async () => {
      button.click();
    });

    expect(container.textContent).toContain(
      "Google sign-in is not enabled for this Supabase project.",
    );
    expect(container.textContent).not.toContain("Unsupported provider");
  });

  function findButton(name: string) {
    const button = Array.from(container.querySelectorAll("button")).find(
      (candidate) => candidate.textContent?.includes(name),
    );
    if (!button) {
      throw new Error(`Expected button named ${name}.`);
    }
    return button as HTMLButtonElement;
  }

  async function settleProviderCheck() {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  }
});
