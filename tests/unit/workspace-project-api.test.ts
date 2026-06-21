import { afterEach, describe, expect, it, vi } from "vitest";

import type { ApiResponse } from "@/lib/contracts/errors";
import { PLAN_ENTITLEMENTS } from "@/lib/contracts/plans";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";

const jsonRequest = (url: string, body: unknown, method = "POST") =>
  new Request(url, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method,
  });

const projectRow = (
  id: string,
  status: "draft" | "uploaded" | "analyzing" | "generated" | "archived",
) => ({
  created_at: "2026-06-06T00:00:00.000Z",
  description: null,
  id,
  latest_version_id: null,
  owner_id: USER_ID,
  source_type: "prompt" as const,
  status,
  title: "Checkout hover",
  updated_at: "2026-06-06T00:00:00.000Z",
  workspace_id: WORKSPACE_ID,
});

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe("workspace API handlers", () => {
  it("rejects anonymous workspace creation before repository writes", async () => {
    const { handleCreateWorkspaceRequest } = await import(
      "@/app/api/workspaces/handler"
    );
    const createWorkspace = vi.fn();

    const response = await handleCreateWorkspaceRequest(
      jsonRequest("https://motioncode.test/api/workspaces", {
        name: "Design Systems",
      }),
      {
        createWorkspace,
        getCurrentUser: vi.fn(async () => null),
      },
    );
    const json = (await response.json()) as ApiResponse<unknown>;

    expect(response.status).toBe(401);
    expect(json).toEqual({
      code: "UNAUTHENTICATED",
      message: "Sign in to manage workspaces.",
      ok: false,
    });
    expect(createWorkspace).not.toHaveBeenCalled();
  });

  it("normalizes workspace names and slugs before creating owned workspaces", async () => {
    const { handleCreateWorkspaceRequest } = await import(
      "@/app/api/workspaces/handler"
    );
    const createWorkspace = vi.fn(async (input) => ({
      created_at: "2026-06-06T00:00:00.000Z",
      id: WORKSPACE_ID,
      name: input.name,
      owner_id: input.ownerId,
      plan_tier: "free" as const,
      slug: input.slug,
      updated_at: "2026-06-06T00:00:00.000Z",
    }));
    const markOnboardingComplete = vi.fn(async () => undefined);

    const response = await handleCreateWorkspaceRequest(
      jsonRequest("https://motioncode.test/api/workspaces", {
        name: "  Design Systems  ",
      }),
      {
        createWorkspace,
        getCurrentUser: vi.fn(async () => ({ id: USER_ID })),
        markOnboardingComplete,
      },
    );
    const json = (await response.json()) as ApiResponse<unknown>;

    expect(response.status).toBe(201);
    expect(json.ok).toBe(true);
    expect(createWorkspace).toHaveBeenCalledWith({
      name: "Design Systems",
      ownerId: USER_ID,
      slug: "design-systems",
    });
    expect(markOnboardingComplete).toHaveBeenCalledWith(USER_ID);
  });

  it("allows only owners and admins to change workspace member roles", async () => {
    const { handleUpdateWorkspaceMemberRequest } = await import(
      "@/app/api/workspaces/members-handler"
    );
    const updateWorkspaceMemberRole = vi.fn();

    const response = await handleUpdateWorkspaceMemberRequest(
      jsonRequest(
        `https://motioncode.test/api/workspaces/${WORKSPACE_ID}/members/${USER_ID}`,
        { role: "admin" },
        "PATCH",
      ),
      {
        getCurrentUser: vi.fn(async () => ({ id: USER_ID })),
        getWorkspaceAccess: vi.fn(async () => ({
          role: "member" as const,
          workspace: { id: WORKSPACE_ID, owner_id: "other-user" },
        })),
        updateWorkspaceMemberRole,
      },
      { memberId: USER_ID, workspaceId: WORKSPACE_ID },
    );
    const json = (await response.json()) as ApiResponse<unknown>;

    expect(response.status).toBe(403);
    expect(json).toMatchObject({
      code: "FORBIDDEN",
      ok: false,
    });
    expect(updateWorkspaceMemberRole).not.toHaveBeenCalled();
  });
});

describe("project API handlers", () => {
  it("requires workspace membership before creating a project", async () => {
    const { handleCreateProjectRequest } = await import(
      "@/app/api/projects/handler"
    );
    const createProject = vi.fn();

    const response = await handleCreateProjectRequest(
      jsonRequest("https://motioncode.test/api/projects", {
        sourceType: "prompt",
        title: "Checkout hover",
        workspaceId: WORKSPACE_ID,
      }),
      {
        createProject,
        getCurrentUser: vi.fn(async () => ({ id: USER_ID })),
        getWorkspaceAccess: vi.fn(async () => null),
      },
    );
    const json = (await response.json()) as ApiResponse<unknown>;

    expect(response.status).toBe(403);
    expect(json).toEqual({
      code: "FORBIDDEN",
      message: "You do not have access to this workspace.",
      ok: false,
    });
    expect(createProject).not.toHaveBeenCalled();
  });

  it("rejects a fourth active project for free workspaces before repository writes", async () => {
    const { handleCreateProjectRequest } = await import(
      "@/app/api/projects/handler"
    );
    const createProject = vi.fn();
    const listProjects = vi.fn(async () => [
      projectRow("44444444-4444-4444-8444-444444444441", "draft"),
      projectRow("44444444-4444-4444-8444-444444444442", "uploaded"),
      projectRow("44444444-4444-4444-8444-444444444443", "generated"),
    ]);

    const response = await handleCreateProjectRequest(
      jsonRequest("https://motioncode.test/api/projects", {
        sourceType: "prompt",
        title: "Checkout hover",
        workspaceId: WORKSPACE_ID,
      }),
      {
        createProject,
        getEntitlementSummary: vi.fn(async () => ({
          entitlements: PLAN_ENTITLEMENTS.free,
          planTier: "free" as const,
        })),
        getCurrentUser: vi.fn(async () => ({ id: USER_ID })),
        getWorkspaceAccess: vi.fn(async () => ({
          role: "owner" as const,
          workspace: {
            id: WORKSPACE_ID,
            owner_id: USER_ID,
            plan_tier: "free" as const,
          },
        })),
        listProjects,
      },
    );
    const json = (await response.json()) as ApiResponse<unknown>;

    expect(response.status).toBe(429);
    expect(json).toEqual({
      code: "QUOTA_EXCEEDED",
      message:
        "Your free plan includes 3 active saved projects. Archive or delete a project before creating another.",
      ok: false,
    });
    expect(listProjects).toHaveBeenCalledWith(USER_ID, WORKSPACE_ID);
    expect(createProject).not.toHaveBeenCalled();
  });

  it("allows free users to create a project after archiving one", async () => {
    const { handleCreateProjectRequest } = await import(
      "@/app/api/projects/handler"
    );
    const createProject = vi.fn(async () => ({
      id: PROJECT_ID,
      status: "draft" as const,
    }));
    const listProjects = vi.fn(async () => [
      projectRow("44444444-4444-4444-8444-444444444441", "draft"),
      projectRow("44444444-4444-4444-8444-444444444442", "generated"),
      projectRow("44444444-4444-4444-8444-444444444443", "archived"),
    ]);

    const response = await handleCreateProjectRequest(
      jsonRequest("https://motioncode.test/api/projects", {
        sourceType: "prompt",
        title: "Checkout hover",
        workspaceId: WORKSPACE_ID,
      }),
      {
        createProject,
        getEntitlementSummary: vi.fn(async () => ({
          entitlements: PLAN_ENTITLEMENTS.free,
          planTier: "free" as const,
        })),
        getCurrentUser: vi.fn(async () => ({ id: USER_ID })),
        getWorkspaceAccess: vi.fn(async () => ({
          role: "owner" as const,
          workspace: {
            id: WORKSPACE_ID,
            owner_id: USER_ID,
            plan_tier: "free" as const,
          },
        })),
        listProjects,
      },
    );
    const json = (await response.json()) as ApiResponse<unknown>;

    expect(response.status).toBe(201);
    expect(json).toMatchObject({
      data: { id: PROJECT_ID, status: "draft" },
      ok: true,
    });
    expect(listProjects).toHaveBeenCalledWith(USER_ID, WORKSPACE_ID);
    expect(createProject).toHaveBeenCalledWith({
      description: null,
      ownerId: USER_ID,
      sourceType: "prompt",
      title: "Checkout hover",
      workspaceId: WORKSPACE_ID,
    });
  });

  it("archives projects instead of deleting Supabase rows", async () => {
    const { handleArchiveProjectRequest } = await import(
      "@/app/api/projects/handler"
    );
    const archiveProject = vi.fn(async () => ({
      id: PROJECT_ID,
      status: "archived" as const,
    }));

    const response = await handleArchiveProjectRequest(
      new Request(`https://motioncode.test/api/projects/${PROJECT_ID}`, {
        method: "DELETE",
      }),
      {
        archiveProject,
        getCurrentUser: vi.fn(async () => ({ id: USER_ID })),
        getProjectAccess: vi.fn(async () => ({
          project: {
            id: PROJECT_ID,
            owner_id: USER_ID,
            workspace_id: WORKSPACE_ID,
          },
          role: "owner" as const,
          workspace: { id: WORKSPACE_ID, owner_id: USER_ID },
        })),
      },
      { projectId: PROJECT_ID },
    );
    const json = (await response.json()) as ApiResponse<unknown>;

    expect(response.status).toBe(200);
    expect(json).toMatchObject({
      data: { id: PROJECT_ID, status: "archived" },
      ok: true,
    });
    expect(archiveProject).toHaveBeenCalledWith(PROJECT_ID);
  });
});
