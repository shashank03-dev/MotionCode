import { describe, expect, it, vi } from "vitest";

import type { AnalysisResult } from "@/lib/contracts/motion";
import { saveAnalysisToWorkspace } from "@/lib/workbench/saveAnalysis";

function analysisResult(): AnalysisResult {
  return {
    assetId: "asset-1",
    createdAt: "2026-07-01T10:00:00.000Z",
    frameCount: 8,
    id: "analysis-1",
    model: "gemini-2.5-pro",
    outputs: [
      {
        code: ".box {}",
        dependencies: [],
        framework: "css",
        setupNotes: [],
        warnings: [],
      },
    ],
    projectId: "unsaved",
    spec: {
      accessibilityNote: "",
      delayMs: 0,
      description: "A card pops in.",
      durationMs: 300,
      easing: "ease-out",
      element: "card",
      gpuAccelerated: true,
      implementationNotes: [],
      intent: "entrance",
      keyframesDetected: 3,
      loops: false,
      performanceScore: 92,
    },
    versionId: "unsaved",
  };
}

type Call = { url: string; body: unknown; method: string };

function fetchStub(
  responder: (url: string, method: string, body: unknown) => unknown,
) {
  const calls: Call[] = [];
  const impl = vi.fn(async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push({ body, method, url });
    return {
      json: async () => responder(url, method, body),
      ok: true,
      status: 200,
    };
  });
  return { calls, impl };
}

describe("saveAnalysisToWorkspace", () => {
  it("appends a sequence to an existing project without creating anything", async () => {
    const { calls, impl } = fetchStub((url) => {
      if (url === "/api/projects/project-9/versions") {
        return { data: { id: "version-9" }, ok: true };
      }
      throw new Error(`unexpected call: ${url}`);
    });

    const outcome = await saveAnalysisToWorkspace(
      analysisResult(),
      { projectId: "project-9" },
      impl,
    );

    expect(outcome).toEqual({
      ok: true,
      projectId: "project-9",
      versionId: "version-9",
      workspaceId: null,
    });
    expect(calls).toHaveLength(1);
    expect((calls[0].body as { motionSpec: AnalysisResult }).motionSpec.id).toBe(
      "analysis-1",
    );
  });

  it("creates a project in the target workspace, then the version", async () => {
    const { calls, impl } = fetchStub((url) => {
      if (url === "/api/projects") {
        return { data: { id: "project-new" }, ok: true };
      }
      if (url === "/api/projects/project-new/versions") {
        return { data: { id: "version-new" }, ok: true };
      }
      throw new Error(`unexpected call: ${url}`);
    });

    const outcome = await saveAnalysisToWorkspace(
      analysisResult(),
      { workspaceId: "ws-1" },
      impl,
    );

    expect(outcome).toEqual({
      ok: true,
      projectId: "project-new",
      versionId: "version-new",
      workspaceId: "ws-1",
    });
    expect(calls.map((call) => call.url)).toEqual([
      "/api/projects",
      "/api/projects/project-new/versions",
    ]);
    expect(calls[0].body).toMatchObject({
      sourceType: "upload",
      title: "card — entrance",
      workspaceId: "ws-1",
    });
  });

  it("falls back to the most recent workspace when no target is given", async () => {
    const { calls, impl } = fetchStub((url, method) => {
      if (url === "/api/workspaces" && method === "GET") {
        return { data: [{ id: "ws-recent" }, { id: "ws-old" }], ok: true };
      }
      if (url === "/api/projects") {
        return { data: { id: "project-new" }, ok: true };
      }
      if (url === "/api/projects/project-new/versions") {
        return { data: { id: "version-new" }, ok: true };
      }
      throw new Error(`unexpected call: ${url}`);
    });

    const outcome = await saveAnalysisToWorkspace(analysisResult(), {}, impl);

    expect(outcome).toMatchObject({ ok: true, workspaceId: "ws-recent" });
    expect(calls[1].body).toMatchObject({ workspaceId: "ws-recent" });
  });

  it("creates a default workspace when the account has none", async () => {
    const { calls, impl } = fetchStub((url, method) => {
      if (url === "/api/workspaces" && method === "GET") {
        return { data: [], ok: true };
      }
      if (url === "/api/workspaces" && method === "POST") {
        return { data: { id: "ws-created" }, ok: true };
      }
      if (url === "/api/projects") {
        return { data: { id: "project-new" }, ok: true };
      }
      if (url === "/api/projects/project-new/versions") {
        return { data: { id: "version-new" }, ok: true };
      }
      throw new Error(`unexpected call: ${url}`);
    });

    const outcome = await saveAnalysisToWorkspace(analysisResult(), {}, impl);

    expect(outcome).toMatchObject({ ok: true, workspaceId: "ws-created" });
    expect(calls[1].body).toMatchObject({ name: "My Workspace" });
  });

  it("reports API failures without throwing", async () => {
    const { impl } = fetchStub((url) => {
      if (url === "/api/projects") {
        return { code: "QUOTA_EXCEEDED", message: "Saved project limit reached.", ok: false };
      }
      throw new Error(`unexpected call: ${url}`);
    });

    const outcome = await saveAnalysisToWorkspace(
      analysisResult(),
      { workspaceId: "ws-1" },
      impl,
    );

    expect(outcome).toEqual({
      ok: false,
      message: "Saved project limit reached.",
    });
  });

  it("never rejects on network errors", async () => {
    const impl = vi.fn(async () => {
      throw new Error("offline");
    });

    const outcome = await saveAnalysisToWorkspace(
      analysisResult(),
      { workspaceId: "ws-1" },
      impl,
    );

    expect(outcome).toMatchObject({ ok: false });
  });
});
