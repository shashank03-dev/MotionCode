"use client";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { Database } from "@/types/database";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];

export function OnboardingForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("My workspace");

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

    router.push(`/workspaces/${json.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="block text-sm text-[#d8cfbc]" htmlFor="workspace-name">
        Workspace name
      </label>
      <input
        id="workspace-name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        minLength={1}
        maxLength={80}
        className="h-11 w-full border border-[#56544966] bg-[#15160f] px-3 text-sm text-[#fffbf4] outline-none focus:border-[#d8cfbc]"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-10 w-full items-center justify-center gap-2 bg-[#d8cfbc] px-4 text-sm font-semibold text-[#11120d] disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        Continue
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </form>
  );
}
