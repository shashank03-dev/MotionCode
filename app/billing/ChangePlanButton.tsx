"use client";

import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { PlanTier } from "@/lib/contracts/plans";

type ChangePlanButtonProps = {
  label: string;
  targetPlanTier: Extract<PlanTier, "pro" | "studio">;
};

type ChangePlanResult = {
  effective: "cycle_end" | "now";
  planTier: PlanTier;
  requestedPlanTier: PlanTier;
  status: string;
};

export function ChangePlanButton({ label, targetPlanTier }: ChangePlanButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function changePlan() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/razorpay/change-plan", {
        body: JSON.stringify({ planTier: targetPlanTier }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as ApiResponse<ChangePlanResult>;

      if (!json.ok) {
        setError(json.message);
        setLoading(false);
        return;
      }

      const query =
        json.data.effective === "now" ? "plan=upgraded" : "plan=scheduled";
      window.location.assign(`/billing?${query}`);
    } catch {
      setError("Could not change your plan. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        className="inline-flex h-10 items-center justify-center gap-2 border border-[var(--accent-border)] bg-[var(--accent-dim)] px-4 font-mono text-sm text-[var(--text)] disabled:opacity-60"
        disabled={loading}
        onClick={changePlan}
        type="button"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="truncate">{label}</span>
      </button>
      {error ? <p className="text-xs leading-5 text-red-200">{error}</p> : null}
    </div>
  );
}
