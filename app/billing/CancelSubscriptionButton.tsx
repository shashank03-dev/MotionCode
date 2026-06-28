"use client";

import { useState } from "react";
import { Loader2, XCircle } from "lucide-react";

import type { ApiResponse } from "@/lib/contracts/errors";

type CancelSubscriptionButtonProps = {
  renewalLabel: string;
};

type CancelResult = {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  status: string;
};

export function CancelSubscriptionButton({
  renewalLabel,
}: CancelSubscriptionButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function cancelSubscription() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/razorpay/cancel", { method: "POST" });
      const json = (await response.json()) as ApiResponse<CancelResult>;

      if (!json.ok) {
        setError(json.message);
        setLoading(false);
        return;
      }

      window.location.assign("/billing?subscription=canceled");
    } catch {
      setError("Could not cancel your subscription. Try again.");
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button
        className="inline-flex h-10 items-center justify-center gap-2 border border-red-400/40 px-4 font-mono text-sm text-red-200"
        onClick={() => setConfirming(true)}
        type="button"
      >
        <XCircle className="h-4 w-4" aria-hidden="true" />
        Cancel subscription
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 border border-red-400/40 bg-red-500/5 p-4">
      <p className="text-sm leading-6 text-red-100">
        You will keep paid access until {renewalLabel}, then your account drops to
        the free plan. To come back after that, subscribe again from pricing.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex h-10 items-center justify-center gap-2 border border-red-400/40 px-4 font-mono text-sm text-red-200 disabled:opacity-60"
          disabled={loading}
          onClick={cancelSubscription}
          type="button"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <XCircle className="h-4 w-4" aria-hidden="true" />
          )}
          Confirm cancellation
        </button>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 border border-[var(--border)] px-4 font-mono text-sm text-[var(--accent)] disabled:opacity-60"
          disabled={loading}
          onClick={() => setConfirming(false)}
          type="button"
        >
          Keep subscription
        </button>
      </div>
      {error ? <p className="text-xs leading-5 text-red-200">{error}</p> : null}
    </div>
  );
}
