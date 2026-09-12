"use client";

import { ChevronRight, Folder, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";

import type { WorkspaceTreeNode } from "@/lib/workbench/tree";
import { cn } from "@/lib/utils";

import { ProjectNode } from "./ProjectNode";

type WorkspaceNodeProps = {
  node: WorkspaceTreeNode;
  expanded: boolean;
  isActive: boolean;
  activeProjectId: string | null;
  onToggle: () => void;
  onAddProject: () => void;
  /** Inline project-create input, rendered by the parent when adding here. */
  createSlot?: React.ReactNode;
};

export function WorkspaceNode({
  node,
  expanded,
  isActive,
  activeProjectId,
  onToggle,
  onAddProject,
  createSlot,
}: WorkspaceNodeProps) {
  const { workspace, projects } = node;
  const FolderIcon = expanded ? FolderOpen : Folder;

  return (
    <li>
      <div
        className={cn(
          "group flex min-h-[44px] items-center gap-1 pr-1 transition",
          isActive
            ? "bg-[var(--accent-dim)] text-ink"
            : "text-ink-2 hover:bg-[var(--accent-dim)]/60",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse workspace" : "Expand workspace"}
          className="flex size-11 shrink-0 items-center justify-center text-ink-3 hover:text-ink"
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform",
              expanded && "rotate-90",
            )}
          />
        </button>
        <Link
          href={`/workspaces/${workspace.id}`}
          aria-current={isActive ? "page" : undefined}
          title={workspace.name}
          className="flex min-w-0 flex-1 items-center gap-2 font-sans text-[13px] hover:text-ink"
        >
          <FolderIcon className="size-3.5 shrink-0 text-ink-2" />
          <span className="truncate">{workspace.name}</span>
        </Link>
        <button
          type="button"
          onClick={onAddProject}
          aria-label={`New project in ${workspace.name}`}
          title="New project"
          className="flex size-11 shrink-0 items-center justify-center text-ink-3 opacity-0 transition hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <Plus className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      {expanded ? (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectNode
                project={project}
                isActive={project.id === activeProjectId}
              />
            </li>
          ))}
          {createSlot ? <li>{createSlot}</li> : null}
          {projects.length === 0 && !createSlot ? (
            <li className="py-1 pl-8 pr-2 font-sans text-xs text-ink-3">
              No projects yet
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}
