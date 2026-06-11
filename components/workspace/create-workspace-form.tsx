"use client";

import type { FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { Database } from "@/types/database";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");

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
      setError(json.message);
      return;
    }

    setName("");
    router.push(`/workspaces/${json.data.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 border border-[var(--border)] bg-[#15160f]/82 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.22)] sm:grid-cols-[1fr_auto]"
    >
      <label className="sr-only" htmlFor="new-workspace-name">
        Workspace name
      </label>
      <input
        id="new-workspace-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="New workspace"
        className="h-10 border border-[var(--border)] bg-[#11120d] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-border)] focus:shadow-[0_0_0_3px_rgba(216,207,188,0.08)]"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-10 items-center justify-center gap-2 border border-[var(--accent-border)] bg-[var(--accent)] px-4 text-sm font-semibold text-[#11120d] transition hover:bg-[#fffbf4] active:translate-y-px disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Create
      </button>
      {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
    </form>
  );
}
