import { describe, expect, it } from "vitest";

import {
  compareProjectVersions,
  createProjectVersionSnapshot,
} from "@/lib/projectVersions";

const motionSpec = {
  accessibilityNote: "Respect reduced motion.",
  delayMs: 0,
  description: "Button compresses on hover.",
  durationMs: 240,
  easing: "ease-out",
  element: "button",
  gpuAccelerated: true,
  implementationNotes: ["Use transform."],
  intent: "hover",
  keyframesDetected: 2,
  loops: false,
  performanceScore: 90,
};

describe("projectVersions", () => {
  it("creates immutable snapshots with the next version number", () => {
    const source = {
      ...motionSpec,
      implementationNotes: [...motionSpec.implementationNotes],
    };

    const snapshot = createProjectVersionSnapshot({
      createdAt: "2026-06-06T12:00:00.000Z",
      createdBy: "user_123",
      id: "version_003",
      label: "handoff",
      motionSpec: source,
      previousVersions: [
        { version_number: 1 },
        { version_number: 2 },
      ],
      projectId: "project_123",
    });

    source.durationMs = 999;
    source.implementationNotes.push("Mutated after snapshot.");

    expect(snapshot).toEqual({
      created_at: "2026-06-06T12:00:00.000Z",
      created_by: "user_123",
      id: "version_003",
      label: "handoff",
      motion_spec: {
        ...motionSpec,
        implementationNotes: ["Use transform."],
      },
      project_id: "project_123",
      version_number: 3,
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.motion_spec)).toBe(true);
  });

  it("compares versions with added, removed, and changed paths", () => {
    const comparison = compareProjectVersions(
      {
        motion_spec: {
          durationMs: 240,
          easing: "ease-out",
          implementationNotes: ["Use transform."],
          loops: false,
        },
        version_number: 1,
      },
      {
        motion_spec: {
          delayMs: 80,
          durationMs: 320,
          implementationNotes: ["Use transform."],
          loops: false,
        },
        version_number: 2,
      },
    );

    expect(comparison.changed).toBe(true);
    expect(comparison.summary).toEqual({
      added: 1,
      changed: 1,
      removed: 1,
      unchanged: 2,
    });
    expect(comparison.changes).toEqual([
      {
        nextValue: 80,
        path: "delayMs",
        previousValue: undefined,
        type: "added",
      },
      {
        nextValue: 320,
        path: "durationMs",
        previousValue: 240,
        type: "changed",
      },
      {
        nextValue: undefined,
        path: "easing",
        previousValue: "ease-out",
        type: "removed",
      },
    ]);
  });

  it("returns an unchanged comparison for equivalent snapshots", () => {
    const comparison = compareProjectVersions(
      { motion_spec: motionSpec, version_number: 1 },
      { motion_spec: { ...motionSpec }, version_number: 2 },
    );

    expect(comparison.changed).toBe(false);
    expect(comparison.changes).toEqual([]);
  });
});
