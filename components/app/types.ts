export type AnalysisStage = "analyzing" | "done" | "error" | "extracting" | "idle";

export type ScoreKey = "a11y" | "accel" | "easing" | "perf";

export type ClientAnalysisIds = {
  assetId: string;
  projectId: string;
  versionId: string;
};
