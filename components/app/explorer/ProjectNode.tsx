"use client";

import { FileCode2 } from "lucide-react";
import Link from "next/link";

import type { ProjectRow } from "@/app/dashboard/data";
import { cn } from "@/lib/utils";

type ProjectNodeProps = {
  project: ProjectRow;
  isActive: boolean;
};

export function ProjectNode({ project, isActive }: ProjectNodeProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      aria-current={isActive ? "page" : undefined}
      title={project.title}
      className={cn(
        "group flex h-8 items-center gap-2 pr-2 font-sans text-[13px] transition",
        "pl-8", // align under the workspace folder label
        isActive
          ? "bg-[var(--accent-dim)] text-[var(--text)]"
          : "text-[var(--accent)] hover:bg-[var(--accent-dim)]/60 hover:text-[var(--text)]",
      )}
    >
      <FileCode2 className="size-3.5 shrink-0 text-[var(--accent)]/60" />
      <span className="truncate">{project.title}</span>
    </Link>
  );
}
