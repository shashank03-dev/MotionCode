"use client";

import type { FormEvent } from "react";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { Database } from "@/types/database";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

type CreateProjectFormProps = {
  workspaceId: string;
};

export function CreateProjectForm({ workspaceId }: CreateProjectFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sourceType, setSourceType] =
    useState<ProjectRow["source_type"]>("prompt");
  const [title, setTitle] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/projects", {
      body: JSON.stringify({
        description,
        sourceType,
        title,
        workspaceId,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const json = (await response.json()) as ApiResponse<ProjectRow>;

    setIsSubmitting(false);
    if (!json.ok) {
      setError(json.message);
      return;
    }

    router.push(`/projects/${json.data.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 border border-[var(--border)] bg-[#15160f]/82 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.22)]"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <label className="sr-only" htmlFor="project-title">
          Project title
        </label>
        <input
          id="project-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Project title"
          maxLength={120}
          className="h-10 border border-[var(--border)] bg-[#11120d] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-border)] focus:shadow-[0_0_0_3px_rgba(216,207,188,0.08)]"
        />
        <label className="sr-only" htmlFor="project-source-type">
          Source type
        </label>
        <select
          id="project-source-type"
          value={sourceType}
          onChange={(event) =>
            setSourceType(event.target.value as ProjectRow["source_type"])
          }
          className="h-10 border border-[var(--border)] bg-[#11120d] px-3 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-border)] focus:shadow-[0_0_0_3px_rgba(216,207,188,0.08)]"
        >
          <option value="prompt">Prompt</option>
          <option value="upload">Upload</option>
          <option value="url">URL</option>
        </select>
      </div>
      <label className="sr-only" htmlFor="project-description">
        Description
      </label>
      <textarea
        id="project-description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description"
        rows={3}
        maxLength={500}
        className="resize-none border border-[var(--border)] bg-[#11120d] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent-border)] focus:shadow-[0_0_0_3px_rgba(216,207,188,0.08)]"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-10 items-center justify-center gap-2 border border-[var(--accent-border)] bg-[var(--accent)] px-4 text-sm font-semibold text-[#11120d] transition hover:bg-[#fffbf4] active:translate-y-px disabled:opacity-60 sm:w-fit"
      >
        {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Create project
      </button>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </form>
  );
}
