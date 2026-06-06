"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { PlanTier } from "@/lib/contracts/plans";

type CheckoutButtonProps = {
  planTier: Extract<PlanTier, "pro" | "studio">;
};

export function CheckoutButton({ planTier }: CheckoutButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        body: JSON.stringify({ planTier }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as ApiResponse<{ url: string }>;

      if (!json.ok) {
        setError(json.message);
        return;
      }

      window.location.assign(json.data.url);
    } catch {
      setError("Checkout could not be started.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        className="inline-flex h-10 items-center justify-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-mono text-sm text-[var(--text)] disabled:opacity-60"
        disabled={loading}
        onClick={startCheckout}
        type="button"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        )}
        Upgrade
      </button>
      {error ? <p className="text-xs leading-5 text-red-200">{error}</p> : null}
    </div>
  );
}
