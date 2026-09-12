"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { PlanTier } from "@/lib/contracts/plans";

type CheckoutButtonProps = {
  planTier: Extract<PlanTier, "pro" | "studio">;
};

type RazorpayCheckoutResponse = {
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_subscription_id: string;
};

type RazorpayCheckoutPayload = {
  description: string;
  keyId: string;
  name: string;
  prefill: {
    email?: string;
  };
  subscriptionId: string;
};

type RazorpayCheckoutOptions = {
  description: string;
  handler: (response: RazorpayCheckoutResponse) => void;
  key: string;
  modal: {
    confirm_close: boolean;
    ondismiss: () => void;
  };
  name: string;
  prefill: {
    email?: string;
  };
  retry: {
    enabled: boolean;
  };
  subscription_id: string;
  theme: {
    color: string;
  };
};

type RazorpayInstance = {
  on: (
    event: "payment.failed",
    handler: (response: { error?: { description?: string } }) => void,
  ) => void;
  open: () => void;
};

type RazorpayConstructor = new (
  options: RazorpayCheckoutOptions,
) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

export function CheckoutButton({ planTier }: CheckoutButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] =
    useState<RazorpayCheckoutResponse | null>(null);

  async function startRazorpayCheckout() {
    setError(null);
    setDismissed(false);
    setPendingVerification(null);
    setLoading(true);

    try {
      await loadRazorpayCheckout();
      const response = await fetch("/api/razorpay/checkout", {
        body: JSON.stringify({ planTier }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as ApiResponse<RazorpayCheckoutPayload>;

      if (!json.ok) {
        setError(json.message);
        setLoading(false);
        return;
      }

      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        throw new Error("Razorpay checkout script did not initialize.");
      }

      const razorpay = new Razorpay({
        description: json.data.description,
        handler: async (checkoutResponse) => {
          setPendingVerification(checkoutResponse);
          await verifyRazorpayCheckout(checkoutResponse);
        },
        key: json.data.keyId,
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setDismissed(true);
            setLoading(false);
          },
        },
        name: json.data.name,
        prefill: json.data.prefill,
        retry: {
          enabled: true,
        },
        subscription_id: json.data.subscriptionId,
        theme: {
          color: "#0099ff",
        },
      });

      razorpay.on("payment.failed", (failure) => {
        setError(failure.error?.description ?? "Razorpay payment failed.");
        setLoading(false);
      });
      razorpay.open();
    } catch (err) {
      console.error("[razorpay] checkout start failed", { planTier, err });
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setError("You appear to be offline. Check your connection and try again.");
      } else if (err instanceof SyntaxError) {
        setError(
          "Checkout service returned unexpected response. Please try again.",
        );
      } else {
        setError(
          "Razorpay checkout could not be started. Disable any ad blocker for checkout.razorpay.com and try again.",
        );
      }
      setLoading(false);
    }
  }

  async function verifyRazorpayCheckout(
    checkoutResponse: RazorpayCheckoutResponse,
  ) {
    try {
      const response = await fetch("/api/razorpay/verify", {
        body: JSON.stringify(checkoutResponse),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as ApiResponse<{
        planTier: PlanTier;
        status: string;
      }>;

      if (!json.ok) {
        setError(json.message);
        return;
      }

      setPendingVerification(null);
      window.location.assign("/account?checkout=success");
    } catch (err) {
      console.error("[razorpay] verify failed", { err, checkoutResponse });
      setError(
        `Razorpay payment ${checkoutResponse.razorpay_payment_id} could not be verified. Do not pay again - contact support with this ID.`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <ProviderButton
        disabled={loading}
        icon={<CreditCard className="h-4 w-4" aria-hidden="true" />}
        label="Pay with Razorpay"
        loading={loading}
        onClick={startRazorpayCheckout}
      />
      {error ? (
        <p className="text-sm leading-5 text-[var(--danger)]">{error}</p>
      ) : null}
      {pendingVerification && error ? (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/support"
            className="text-sm text-accent underline underline-offset-4 transition hover:brightness-125"
          >
            Contact support
          </a>
          <button
            className="text-sm font-medium text-accent underline underline-offset-4 transition hover:brightness-125 disabled:opacity-60"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              void verifyRazorpayCheckout(pendingVerification);
            }}
            type="button"
          >
            Retry verification
          </button>
        </div>
      ) : null}
      {dismissed && !error ? (
        <p className="text-sm leading-5 text-ink-2">
          Checkout closed before payment completed.{" "}
          <a
            href="/support"
            className="text-accent underline underline-offset-4 transition hover:brightness-125"
          >
            Contact support
          </a>{" "}
          if you need help completing payment.
        </p>
      ) : null}
    </div>
  );
}

function ProviderButton({
  icon,
  disabled,
  label,
  loading,
  onClick,
}: {
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-black shadow-glow transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
      <span className="truncate">{label}</span>
    </button>
  );
}

function loadRazorpayCheckout() {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existingScript) {
      if (existingScript.dataset.loadFailed === "1") {
        reject(new Error("razorpay-script-previously-failed"));
        return;
      }
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => {
          existingScript.dataset.loadFailed = "1";
          reject(new Error("razorpay-script-load-failed"));
        },
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => {
      script.dataset.loadFailed = "1";
      reject(new Error("razorpay-script-load-failed"));
    };
    document.body.appendChild(script);
  });
}
