import { describe, expect, it } from "vitest";

import type { ProjectRow, WorkspaceRow } from "@/app/dashboard/data";
import { buildWorkspaceTree } from "@/lib/workbench/tree";

function workspace(id: string, name: string): WorkspaceRow {
  return {
    created_at: "2026-06-30T00:00:00.000Z",
    id,
    name,
    owner_id: "owner-1",
    plan_tier: "free",
    slug: name.toLowerCase(),
    updated_at: "2026-06-30T00:00:00.000Z",
  } as WorkspaceRow;
}

function project(id: string, workspaceId: string, title: string): ProjectRow {
  return {
    id,
    title,
    workspace_id: workspaceId,
    status: "draft",
    source_type: "prompt",
    updated_at: "2026-06-30T00:00:00.000Z",
  } as ProjectRow;
}

describe("buildWorkspaceTree", () => {
  it("nests projects under their workspace and preserves order", () => {
    const tree = buildWorkspaceTree(
      [workspace("w1", "Alpha"), workspace("w2", "Beta")],
      [
        project("p1", "w1", "One"),
        project("p2", "w2", "Two"),
        project("p3", "w1", "Three"),
      ],
    );

    expect(tree.map((node) => node.workspace.id)).toEqual(["w1", "w2"]);
    expect(tree[0].projects.map((p) => p.id)).toEqual(["p1", "p3"]);
    expect(tree[1].projects.map((p) => p.id)).toEqual(["p2"]);
  });

  it("returns an empty project list for workspaces with no projects", () => {
    const tree = buildWorkspaceTree([workspace("w1", "Alpha")], []);
    expect(tree).toHaveLength(1);
    expect(tree[0].projects).toEqual([]);
  });

  it("drops projects whose workspace is not visible", () => {
    const tree = buildWorkspaceTree(
      [workspace("w1", "Alpha")],
      [project("p1", "w1", "One"), project("p2", "ghost", "Orphan")],
    );

    expect(tree[0].projects.map((p) => p.id)).toEqual(["p1"]);
    expect(tree).toHaveLength(1);
  });
});
