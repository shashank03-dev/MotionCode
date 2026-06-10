import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInWithOAuth = vi.fn();
const signInWithOtp = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      signInWithOAuth,
      signInWithOtp,
    },
  }),
}));

describe("LoginForm", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    signInWithOAuth.mockReset();
    signInWithOtp.mockReset();
    signInWithOAuth.mockResolvedValue({ error: null });
    signInWithOtp.mockResolvedValue({ error: null });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    window.history.replaceState(null, "", "/login");
  });

  afterEach(() => {
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

    const button = findButton("Continue with Google");
    await act(async () => {
      button.click();
    });

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo:
          `${window.location.origin}/auth/callback?next=%2Fworkspaces%2Fworkspace_123`,
      },
    });
  });

  it("keeps magic-link auth using the same callback destination", async () => {
    const { LoginForm } = await import("@/components/dashboard/login-form");

    await act(async () => {
      root.render(<LoginForm nextPath="/projects/project_123" />);
    });

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

  function findButton(name: string) {
    const button = Array.from(container.querySelectorAll("button")).find(
      (candidate) => candidate.textContent?.includes(name),
    );
    if (!button) {
      throw new Error(`Expected button named ${name}.`);
    }
    return button as HTMLButtonElement;
  }
});
