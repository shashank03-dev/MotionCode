import type { Json } from "@/types/database";

export type PreviousProjectVersion = {
  version_number: number;
};

export type CreateProjectVersionSnapshotInput = {
  projectId: string;
  createdBy: string;
  motionSpec: Json;
  label?: string | null;
  id?: string;
  createdAt?: string;
  latestVersionNumber?: number | null;
  previousVersions?: PreviousProjectVersion[];
};

export type ProjectVersionSnapshot = Readonly<{
  id?: string;
  project_id: string;
  created_by: string;
  version_number: number;
  label: string | null;
  motion_spec: Json;
  created_at: string;
}>;

export type ComparableProjectVersion = {
  version_number?: number;
  motion_spec?: Json;
  motionSpec?: Json;
};

export type ProjectVersionChangeType = "added" | "removed" | "changed";

export type ProjectVersionChange = {
  path: string;
  type: ProjectVersionChangeType;
  previousValue: Json | undefined;
  nextValue: Json | undefined;
};

export type ProjectVersionComparison = {
  previousVersionNumber: number | null;
  nextVersionNumber: number | null;
  changed: boolean;
  changes: ProjectVersionChange[];
  summary: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
  };
};

export function createProjectVersionSnapshot(
  input: CreateProjectVersionSnapshotInput,
): ProjectVersionSnapshot {
  const snapshot = {
    ...(input.id ? { id: input.id } : {}),
    created_at: input.createdAt ?? new Date().toISOString(),
    created_by: input.createdBy,
    label: input.label?.trim() || null,
    motion_spec: cloneJson(input.motionSpec),
    project_id: input.projectId,
    version_number: nextVersionNumber(input),
  };

  return deepFreeze(snapshot) as ProjectVersionSnapshot;
}

export function compareProjectVersions(
  previous: ComparableProjectVersion,
  next: ComparableProjectVersion,
): ProjectVersionComparison {
  const previousValues = flattenSpec(versionSpec(previous));
  const nextValues = flattenSpec(versionSpec(next));
  const paths = Array.from(
    new Set([...Object.keys(previousValues), ...Object.keys(nextValues)]),
  ).sort();

  const changes: ProjectVersionChange[] = [];
  let unchanged = 0;

  for (const path of paths) {
    const previousHasPath = Object.prototype.hasOwnProperty.call(
      previousValues,
      path,
    );
    const nextHasPath = Object.prototype.hasOwnProperty.call(nextValues, path);
    const previousValue = previousValues[path];
    const nextValue = nextValues[path];

    if (!previousHasPath && nextHasPath) {
      changes.push({
        nextValue,
        path,
        previousValue: undefined,
        type: "added",
      });
      continue;
    }

    if (previousHasPath && !nextHasPath) {
      changes.push({
        nextValue: undefined,
        path,
        previousValue,
        type: "removed",
      });
      continue;
    }

    if (!jsonEqual(previousValue, nextValue)) {
      changes.push({
        nextValue,
        path,
        previousValue,
        type: "changed",
      });
      continue;
    }

    unchanged += 1;
  }

  return {
    changed: changes.length > 0,
    changes,
    nextVersionNumber: next.version_number ?? null,
    previousVersionNumber: previous.version_number ?? null,
    summary: {
      added: changes.filter((change) => change.type === "added").length,
      changed: changes.filter((change) => change.type === "changed").length,
      removed: changes.filter((change) => change.type === "removed").length,
      unchanged,
    },
  };
}

function nextVersionNumber(input: CreateProjectVersionSnapshotInput) {
  if (
    typeof input.latestVersionNumber === "number" &&
    Number.isFinite(input.latestVersionNumber)
  ) {
    return Math.max(1, Math.floor(input.latestVersionNumber) + 1);
  }

  const previousMax = Math.max(
    0,
    ...(input.previousVersions ?? []).map((version) =>
      Number.isFinite(version.version_number)
        ? Math.floor(version.version_number)
        : 0,
    ),
  );

  return previousMax + 1;
}

function versionSpec(version: ComparableProjectVersion) {
  return version.motion_spec ?? version.motionSpec ?? {};
}

function flattenSpec(
  value: Json | undefined,
  path = "",
  output: Record<string, Json | undefined> = {},
) {
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0 && path) {
      output[path] = value;
    }

    for (const [key, nested] of entries) {
      flattenSpec(nested, path ? `${path}.${key}` : key, output);
    }

    return output;
  }

  if (path) {
    output[path] = value;
  }

  return output;
}

function cloneJson<T extends Json>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value as Readonly<T>;
  }

  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }

  return Object.freeze(value);
}

function isPlainObject(value: unknown): value is Record<string, Json> {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function jsonEqual(left: Json | undefined, right: Json | undefined) {
  return stableJson(left) === stableJson(right);
}

function stableJson(value: Json | undefined): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
