"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { Database } from "@/types/database";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

type ArchiveProjectButtonProps = {
  children: ReactNode;
  projectId: string;
};

export function ArchiveProjectButton({
  children,
  projectId,
}: ArchiveProjectButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });
    const json = (await response.json()) as ApiResponse<ProjectRow>;

    setIsSubmitting(false);
    if (!json.ok) {
      setError(json.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        className="inline-flex h-10 items-center justify-center gap-2 border border-[#d8cfbc66] px-4 text-sm text-[#d8cfbc] disabled:opacity-60"
      >
        {children}
      </button>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
