import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CheckoutButton } from "@/app/pricing/CheckoutButton";

/**
 * CheckoutButton messaging contract (jsdom + act + createRoot, matching
 * login-form / marketing-auth-nav-actions conventions; no @testing-library
 * in package.json).
 *
 * window.Razorpay is stubbed so loadRazorpayCheckout resolves without
 * appending the real checkout.js script; fetch is spied per test.
 */

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_subscription_id: string;
};

let capturedOptions: {
  handler: (response: RazorpayResponse) => Promise<void> | void;
  modal: { ondismiss: () => void };
} | null = null;

const openMock = vi.fn();
const onMock = vi.fn();

const checkoutPayload = {
  data: {
    description: "Pro subscription",
    keyId: "rzp_test_key",
    name: "MotionCode",
    prefill: {},
    subscriptionId: "sub_123",
  },
  ok: true,
};

function installRazorpayStub() {
  capturedOptions = null;
  openMock.mockReset();
  onMock.mockClear();
  // Must be a real constructable (not vi.fn): the component uses `new`.
  // Returning an object from the constructor overrides `this`, matching the
  // Razorpay instance shape the component consumes.
  function MockRazorpay(this: unknown, options: typeof capturedOptions) {
    capturedOptions = options;
    return { on: onMock, open: openMock };
  }
  (window as unknown as Record<string, unknown>).Razorpay =
    MockRazorpay as unknown as new (
      options: typeof capturedOptions,
    ) => { on: typeof onMock; open: typeof openMock };
}

function checkoutResponse() {
  return {
    json: async () => checkoutPayload,
  } as unknown as Response;
}

function verifySuccessResponse() {
  return {
    json: async () => ({ data: { planTier: "pro", status: "active" }, ok: true }),
  } as unknown as Response;
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function payButton(container: HTMLDivElement) {
  const button = Array.from(container.querySelectorAll("button")).find((node) =>
    node.textContent?.includes("Pay with Razorpay"),
  );
  if (!button) throw new Error("Expected Pay with Razorpay button.");
  return button as HTMLButtonElement;
}

describe("CheckoutButton", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let originalOnLine: boolean;

  beforeEach(() => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    installRazorpayStub();
    fetchSpy = vi.spyOn(globalThis, "fetch");
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    originalOnLine = window.navigator.onLine;
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.body.innerHTML = "";
    delete (window as unknown as Record<string, unknown>).Razorpay;
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: originalOnLine,
    });
    vi.restoreAllMocks();
  });

  it("shows help copy when the checkout modal is dismissed", async () => {
    fetchSpy.mockResolvedValue(checkoutResponse());

    await act(async () => {
      root.render(<CheckoutButton planTier="pro" />);
    });

    await act(async () => {
      payButton(container).click();
    });
    await flush();

    expect(openMock).toHaveBeenCalledTimes(1);
    expect(capturedOptions).not.toBeNull();

    await act(async () => {
      capturedOptions?.modal.ondismiss();
    });

    expect(container.textContent).toContain(
      "Checkout closed before payment completed.",
    );
    expect(container.textContent).toContain(
      "if you need help completing payment.",
    );
    expect(container.textContent).not.toContain("Do not pay again");
  });

  it("shows the payment ID with do-not-pay-again copy and retries verify", async () => {
    const verifyCalls: string[] = [];
    fetchSpy.mockImplementation(
      async (input: Parameters<typeof fetch>[0]) => {
        const url = String(input);
        if (url.includes("/api/razorpay/verify")) {
          verifyCalls.push(url);
          if (verifyCalls.length === 1) {
            throw new Error("verify boom");
          }
          return verifySuccessResponse();
        }
        return checkoutResponse();
      },
    );

    await act(async () => {
      root.render(<CheckoutButton planTier="pro" />);
    });
    await act(async () => {
      payButton(container).click();
    });
    await flush();

    await act(async () => {
      await capturedOptions?.handler({
        razorpay_payment_id: "pay_123",
        razorpay_signature: "sig_123",
        razorpay_subscription_id: "sub_123",
      });
    });
    await flush();

    expect(container.textContent).toContain("pay_123");
    expect(container.textContent).toContain("Do not pay again");
    const retry = Array.from(container.querySelectorAll("button")).find((node) =>
      node.textContent?.includes("Retry verification"),
    );
    expect(retry).not.toBeUndefined();

    await act(async () => {
      (retry as HTMLButtonElement).click();
    });
    await flush();

    expect(verifyCalls).toHaveLength(2);
    // Success clears pendingVerification, so the retry affordance unmounts
    // right before window.location.assign("/account?checkout=success").
    // (jsdom's Location.assign is non-configurable, so the redirect itself
    // is covered by the verify re-call + pending-cleared transition.)
    await expect
      .poll(() =>
        Array.from(container.querySelectorAll("button")).some((node) =>
          node.textContent?.includes("Retry verification"),
        ),
      )
      .toBe(false);
  });

  it("shows offline copy when navigator is offline", async () => {
    Object.defineProperty(window.navigator, "onLine", {
      configurable: true,
      value: false,
    });
    fetchSpy.mockRejectedValue(new Error("network down"));

    await act(async () => {
      root.render(<CheckoutButton planTier="pro" />);
    });
    await act(async () => {
      payButton(container).click();
    });
    await flush();

    expect(container.textContent).toContain("You appear to be offline.");
  });

  it("shows unexpected-response copy on SyntaxError", async () => {
    fetchSpy.mockResolvedValue({
      json: async () => {
        throw new SyntaxError("Unexpected token '<'");
      },
    } as unknown as Response);

    await act(async () => {
      root.render(<CheckoutButton planTier="pro" />);
    });
    await act(async () => {
      payButton(container).click();
    });
    await flush();

    expect(container.textContent).toContain(
      "Checkout service returned unexpected response.",
    );
  });

  it("shows adblock copy on generic start failures", async () => {
    fetchSpy.mockRejectedValue(new Error("Failed to fetch"));

    await act(async () => {
      root.render(<CheckoutButton planTier="pro" />);
    });
    await act(async () => {
      payButton(container).click();
    });
    await flush();

    expect(container.textContent).toContain("Disable ad blocker");
    expect(container.textContent).toContain("checkout.razorpay.com");
  });
});
