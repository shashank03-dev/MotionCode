import type { ApiResponse } from "@/lib/contracts/errors";
import type { AnalysisResult } from "@/lib/contracts/motion";

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Pick<Response, "json" | "ok" | "status">>;

export type SaveAnalysisTarget = {
  /** Workspace the analysis should land in; falls back to the most recent one. */
  workspaceId?: string | null;
  /** Existing project to append to — a new sequence instead of a new project. */
  projectId?: string | null;
};

export type SaveAnalysisOutcome =
  | { ok: true; projectId: string; versionId: string; workspaceId: string | null }
  | { ok: false; message: string };

const DEFAULT_WORKSPACE_NAME = "My Workspace";
const SAVE_FAILED_MESSAGE = "Analysis finished but could not be saved.";

/**
 * Persists a completed analysis as a project sequence via the existing REST
 * APIs. Resolution order for the destination:
 *
 * 1. `target.projectId` — append a new version ("sequence") to that project.
 * 2. `target.workspaceId` — create a new project inside that workspace.
 * 3. The user's most recently updated workspace.
 * 4. A freshly created "My Workspace" when the account has none yet.
 *
 * The full AnalysisResult is stored as the version's motion_spec so saved
 * sequences re-open as the real studio (preview + generated code), not just a
 * spec dump.
 */
export async function saveAnalysisToWorkspace(
  result: AnalysisResult,
  target: SaveAnalysisTarget = {},
  fetchImpl: FetchLike = fetch,
): Promise<SaveAnalysisOutcome> {
  try {
    if (target.projectId) {
      const version = await createVersion(fetchImpl, target.projectId, result);
      if (!version.ok) return version;
      return {
        ok: true,
        projectId: target.projectId,
        versionId: version.versionId,
        workspaceId: target.workspaceId ?? null,
      };
    }

    const workspaceId =
      target.workspaceId ?? (await resolveWorkspaceId(fetchImpl));
    if (!workspaceId) {
      return { ok: false, message: SAVE_FAILED_MESSAGE };
    }

    const project = await postJson<{ id: string }>(fetchImpl, "/api/projects", {
      description: truncate(result.spec.description, 500),
      sourceType: "upload",
      title: buildProjectTitle(result),
      workspaceId,
    });
    if (!project.ok) {
      return { ok: false, message: project.message };
    }

    const version = await createVersion(fetchImpl, project.data.id, result);
    if (!version.ok) return version;

    return {
      ok: true,
      projectId: project.data.id,
      versionId: version.versionId,
      workspaceId,
    };
  } catch {
    return { ok: false, message: SAVE_FAILED_MESSAGE };
  }
}

async function createVersion(
  fetchImpl: FetchLike,
  projectId: string,
  result: AnalysisResult,
): Promise<{ ok: true; versionId: string } | { ok: false; message: string }> {
  const version = await postJson<{ id: string }>(
    fetchImpl,
    `/api/projects/${projectId}/versions`,
    {
      label: truncate(`${result.spec.intent} · ${result.spec.element}`, 80),
      motionSpec: result,
    },
  );
  if (!version.ok) {
    return { ok: false, message: version.message };
  }
  return { ok: true, versionId: version.data.id };
}

async function resolveWorkspaceId(fetchImpl: FetchLike): Promise<string | null> {
  const response = await fetchImpl("/api/workspaces");
  const payload = (await response.json()) as ApiResponse<Array<{ id: string }>>;
  if (payload.ok && payload.data.length > 0) {
    return payload.data[0].id;
  }

  const created = await postJson<{ id: string }>(fetchImpl, "/api/workspaces", {
    name: DEFAULT_WORKSPACE_NAME,
  });
  return created.ok ? created.data.id : null;
}

async function postJson<T>(
  fetchImpl: FetchLike,
  url: string,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  const response = await fetchImpl(url, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const payload = (await response.json()) as ApiResponse<T>;
  if (!payload.ok) {
    return { ok: false, message: payload.message || SAVE_FAILED_MESSAGE };
  }
  return { ok: true, data: payload.data };
}

function buildProjectTitle(result: AnalysisResult) {
  const element = result.spec.element.trim() || "Motion";
  const intent = result.spec.intent.trim();
  return truncate(intent ? `${element} — ${intent}` : element, 120);
}

function truncate(value: string, max: number) {
  const trimmed = value.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}
