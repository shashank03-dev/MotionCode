"use client";

import type { FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { UpgradeDialog } from "@/components/app/UpgradeDialog";
import { Input, Panel } from "@/components/ui/kit";
import type { ApiResponse } from "@/lib/contracts/errors";
import type { Database } from "@/types/database";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
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
      // A quota block (free tier / plan cap) opens the upgrade prompt; the
      // typed name is kept so the user can retry right after upgrading.
      if (json.code === "BILLING_REQUIRED") {
        setUpgradeMessage(json.message);
        return;
      }
      setError(json.message);
      return;
    }

    setName("");
    router.push(`/workspaces/${json.data.id}`);
    router.refresh();
  }

  return (
    <Panel variant="hairline" inset="none" radius="2xl" className="p-4 sm:p-5">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="sr-only" htmlFor="new-workspace-name">
          Workspace name
        </label>
        <Input
          id="new-workspace-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name a new workspace…"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-black shadow-glow transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          Create
        </button>
        {error ? (
          <p className="font-mono text-[12.5px] text-[var(--danger)] sm:col-span-2">
            {error}
          </p>
        ) : null}
      </form>
      <UpgradeDialog
        open={upgradeMessage !== null}
        onClose={() => setUpgradeMessage(null)}
        message={upgradeMessage}
      />
    </Panel>
  );
}
