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
      className="grid gap-3 border border-[#56544966] bg-[#15160f] p-4 sm:grid-cols-[1fr_auto]"
    >
      <label className="sr-only" htmlFor="new-workspace-name">
        Workspace name
      </label>
      <input
        id="new-workspace-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="New workspace"
        className="h-10 border border-[#56544966] bg-[#11120d] px-3 text-sm text-[#fffbf4] outline-none focus:border-[#d8cfbc]"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-10 items-center justify-center gap-2 bg-[#d8cfbc] px-4 text-sm font-semibold text-[#11120d] disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Create
      </button>
      {error ? <p className="text-sm text-red-300 sm:col-span-2">{error}</p> : null}
    </form>
  );
}
