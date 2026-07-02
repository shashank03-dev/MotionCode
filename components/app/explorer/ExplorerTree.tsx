"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { Database } from "@/types/database";
import type { WorkspaceTreeNode } from "@/lib/workbench/tree";

import { InlineCreate } from "./InlineCreate";
import { WorkspaceNode } from "./WorkspaceNode";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

type ExplorerTreeProps = {
  tree: WorkspaceTreeNode[];
};

/** Pull the active workspace/project id straight off the URL. */
function readSelectionFromPath(pathname: string) {
  const project = pathname.match(/^\/projects\/([^/]+)/);
  const workspace = pathname.match(/^\/workspaces\/([^/]+)/);
  return {
    activeProjectId: project?.[1] ?? null,
    activeWorkspaceId: workspace?.[1] ?? null,
  };
}

export function ExplorerTree({ tree }: ExplorerTreeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeProjectId, activeWorkspaceId } = readSelectionFromPath(pathname);

  // Workspace that owns the active project — so it auto-expands on deep links.
  const projectWorkspaceId = useMemo(() => {
    if (!activeProjectId) return null;
    for (const node of tree) {
      if (node.projects.some((project) => project.id === activeProjectId)) {
        return node.workspace.id;
      }
    }
    return null;
  }, [activeProjectId, tree]);

  // User-toggled workspaces. The selected branch is always shown open via the
  // render-time union below, so deep links and the active project stay visible.
  // The workbench layout keeps this tree mounted, so toggles persist across
  // in-app navigation without any external storage.
  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set());
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [creatingProjectIn, setCreatingProjectIn] = useState<string | null>(
    null,
  );

  const isOpen = useCallback(
    (workspaceId: string) =>
      openSet.has(workspaceId) ||
      workspaceId === projectWorkspaceId ||
      workspaceId === activeWorkspaceId,
    [openSet, projectWorkspaceId, activeWorkspaceId],
  );

  const toggle = useCallback((workspaceId: string) => {
    setOpenSet((current) => {
      const next = new Set(current);
      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);
      }
      return next;
    });
  }, []);

  const openProjectCreate = useCallback((workspaceId: string) => {
    setCreatingProjectIn(workspaceId);
    setOpenSet((current) => {
      if (current.has(workspaceId)) return current;
      const next = new Set(current);
      next.add(workspaceId);
      return next;
    });
  }, []);

  async function createWorkspace(name: string) {
    const response = await fetch("/api/workspaces", {
      body: JSON.stringify({ name }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const json = (await response.json()) as ApiResponse<WorkspaceRow>;
    if (!json.ok) {
      return { ok: false as const, message: json.message };
    }
    router.push(`/workspaces/${json.data.id}`);
    router.refresh();
    return { ok: true as const };
  }

  async function createProject(workspaceId: string, title: string) {
    const response = await fetch("/api/projects", {
      body: JSON.stringify({
        description: "",
        sourceType: "prompt",
        title,
        workspaceId,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    const json = (await response.json()) as ApiResponse<ProjectRow>;
    if (!json.ok) {
      return { ok: false as const, message: json.message };
    }
    router.push(`/projects/${json.data.id}`);
    router.refresh();
    return { ok: true as const };
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 items-center justify-between px-3">
        <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]/70">
          Explorer
        </span>
        <button
          type="button"
          onClick={() => setCreatingWorkspace(true)}
          aria-label="New workspace"
          title="New workspace"
          className="flex size-6 items-center justify-center border border-[var(--accent-border)] bg-[var(--accent-dim)] text-[var(--text)] transition hover:border-[var(--accent)]"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-3">
        {creatingWorkspace ? (
          <InlineCreate
            placeholder="Workspace name"
            onSubmit={createWorkspace}
            onClose={() => setCreatingWorkspace(false)}
          />
        ) : null}

        {tree.length === 0 && !creatingWorkspace ? (
          <button
            type="button"
            onClick={() => setCreatingWorkspace(true)}
            className="mx-3 mt-2 flex w-[calc(100%-1.5rem)] flex-col items-start gap-1 border border-dashed border-[var(--border)] px-3 py-4 text-left transition hover:border-[var(--accent-border)]"
          >
            <span className="font-sans text-[13px] font-medium text-[var(--text)]">
              Create your first workspace
            </span>
            <span className="font-sans text-xs leading-5 text-[var(--accent)]/75">
              Group projects, then analyze references inside.
            </span>
          </button>
        ) : null}

        <ul>
          {tree.map((node) => (
            <WorkspaceNode
              key={node.workspace.id}
              node={node}
              expanded={isOpen(node.workspace.id)}
              isActive={node.workspace.id === activeWorkspaceId}
              activeProjectId={activeProjectId}
              onToggle={() => toggle(node.workspace.id)}
              onAddProject={() => openProjectCreate(node.workspace.id)}
              createSlot={
                creatingProjectIn === node.workspace.id ? (
                  <InlineCreate
                    placeholder="Project title"
                    indent={20}
                    onSubmit={(title) =>
                      createProject(node.workspace.id, title)
                    }
                    onClose={() => setCreatingProjectIn(null)}
                  />
                ) : null
              }
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
