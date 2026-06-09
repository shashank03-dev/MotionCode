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
    ondismiss: () => void;
  };
  name: string;
  prefill: {
    email?: string;
  };
  subscription_id: string;
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
  const [loading, setLoading] = useState(false);

  async function startRazorpayCheckout() {
    setError(null);
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
          await verifyRazorpayCheckout(checkoutResponse);
        },
        key: json.data.keyId,
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        name: json.data.name,
        prefill: json.data.prefill,
        subscription_id: json.data.subscriptionId,
      });

      razorpay.on("payment.failed", (failure) => {
        setError(failure.error?.description ?? "Razorpay payment failed.");
        setLoading(false);
      });
      razorpay.open();
    } catch {
      setError("Razorpay checkout could not be started.");
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

      window.location.assign("/account?checkout=success");
    } catch {
      setError("Razorpay checkout could not be verified.");
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
      {error ? <p className="text-xs leading-5 text-red-200">{error}</p> : null}
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
      className="inline-flex h-10 min-w-0 items-center justify-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-3 font-mono text-sm text-[var(--text)] disabled:opacity-60"
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
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error()), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error());
    document.body.appendChild(script);
  });
}
