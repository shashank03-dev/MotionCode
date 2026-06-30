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
          "group flex h-9 items-center gap-1 pr-1 transition",
          isActive
            ? "bg-[var(--accent-dim)] text-[var(--text)]"
            : "text-[var(--accent)] hover:bg-[var(--accent-dim)]/60",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse workspace" : "Expand workspace"}
          className="flex size-6 shrink-0 items-center justify-center text-[var(--muted)] hover:text-[var(--text)]"
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
          className="flex min-w-0 flex-1 items-center gap-2 font-mono text-xs hover:text-[var(--text)]"
        >
          <FolderIcon className="size-3.5 shrink-0 text-[var(--accent)]" />
          <span className="truncate">{workspace.name}</span>
        </Link>
        <button
          type="button"
          onClick={onAddProject}
          aria-label={`New project in ${workspace.name}`}
          title="New project"
          className="flex size-6 shrink-0 items-center justify-center text-[var(--muted)] opacity-0 transition hover:text-[var(--text)] focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Plus className="size-3.5" />
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
            <li className="pl-8 pr-2 py-1 font-mono text-[10px] text-[var(--muted)]">
              No projects yet
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}
