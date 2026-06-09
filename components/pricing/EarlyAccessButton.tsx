"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { PlanTier } from "@/lib/contracts/plans";

type EarlyAccessButtonProps = {
  planTier: Extract<PlanTier, "pro" | "studio">;
};

export function EarlyAccessButton({ planTier }: EarlyAccessButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  async function requestEarlyAccess() {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/early-access", {
        body: JSON.stringify({ desiredPlan: planTier }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as ApiResponse<{
        desiredPlan: "pro" | "studio";
        status: string;
      }>;

      if (!json.ok) {
        setError(json.message);
        return;
      }

      setRequested(true);
    } catch {
      setError("Early access request could not be saved.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        className="inline-flex h-11 w-full items-center justify-center gap-2 border border-[#00ff88]/60 bg-[#00ff88]/10 px-4 font-mono text-xs font-bold text-[#00ff88] transition-colors hover:bg-[#00ff88]/15 disabled:opacity-60"
        disabled={loading || requested}
        onClick={requestEarlyAccess}
        type="button"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        {requested ? "Early access requested" : "Join early access"}
      </button>
      {error ? <p className="text-xs leading-5 text-red-200">{error}</p> : null}
    </div>
  );
}
