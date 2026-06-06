"use client";

import type { FormEvent } from "react";
import { Code2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { Database } from "@/types/database";

type ProjectVersionRow =
  Database["public"]["Tables"]["project_versions"]["Row"];

type CreateVersionFormProps = {
  projectId: string;
};

const DEFAULT_SPEC = `{
  "intent": "hover",
  "element": "button",
  "durationMs": 320,
  "easing": "cubic-bezier(0.4, 0, 0.2, 1)"
}`;

export function CreateVersionForm({ projectId }: CreateVersionFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [label, setLabel] = useState("");
  const [motionSpec, setMotionSpec] = useState(DEFAULT_SPEC);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    let parsedSpec: unknown;
    try {
      parsedSpec = JSON.parse(motionSpec);
    } catch {
      setIsSubmitting(false);
      setError("Motion spec must be valid JSON.");
      return;
    }

    const response = await fetch(`/api/projects/${projectId}/versions`, {
      body: JSON.stringify({ label, motionSpec: parsedSpec }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const json = (await response.json()) as ApiResponse<ProjectVersionRow>;

    setIsSubmitting(false);
    if (!json.ok) {
      setError(json.message);
      return;
    }

    router.push(`/projects/${projectId}/versions/${json.data.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 border border-[#56544966] bg-[#15160f] p-4"
    >
      <label className="sr-only" htmlFor="version-label">
        Version label
      </label>
      <input
        id="version-label"
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="Version label"
        maxLength={80}
        className="h-10 border border-[#56544966] bg-[#11120d] px-3 text-sm text-[#fffbf4] outline-none focus:border-[#d8cfbc]"
      />
      <label className="sr-only" htmlFor="motion-spec">
        Motion spec
      </label>
      <textarea
        id="motion-spec"
        value={motionSpec}
        onChange={(event) => setMotionSpec(event.target.value)}
        rows={8}
        className="resize-y border border-[#56544966] bg-[#11120d] px-3 py-2 font-mono text-xs leading-5 text-[#fffbf4] outline-none focus:border-[#d8cfbc]"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-10 items-center justify-center gap-2 bg-[#d8cfbc] px-4 text-sm font-semibold text-[#11120d] disabled:opacity-60 sm:w-fit"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Code2 className="size-4" />}
        Save version
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </form>
  );
}
