"use client";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { Database } from "@/types/database";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

import { UpgradeDialog } from "@/components/app/UpgradeDialog";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];

export function OnboardingForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("My workspace");
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/workspaces", {
      body: JSON.stringify({ name }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const json = (await response.json()) as ApiResponse<WorkspaceRow>;

    setIsSubmitting(false);
    if (!json.ok) {
      if (json.code === "BILLING_REQUIRED") {
        setUpgradeMessage(json.message);
        return;
      }
      setError(json.message);
      return;
    }

    router.push(`/workspaces/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="block text-sm text-ink-2" htmlFor="workspace-name">
        Workspace name
      </label>
      <input
        id="workspace-name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        minLength={1}
        maxLength={80}
        className="h-11 w-full border border-hairline bg-[#0a0b0d] px-3 text-base text-ink outline-none transition focus:border-[var(--accent-border)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-11 min-h-[44px] w-full items-center justify-center gap-2 border border-[var(--accent-border)] bg-[var(--accent)] px-4 text-sm font-semibold text-[#0a0b0d] transition hover:bg-ink active:translate-y-px disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        Continue
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <UpgradeDialog
        open={upgradeMessage !== null}
        onClose={() => setUpgradeMessage(null)}
        message={upgradeMessage}
      />
    </form>
  );
}
