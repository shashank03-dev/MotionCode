import { z } from "zod";

import {
  ANALYSIS_MODELS,
  OUTPUT_FRAMEWORKS,
  type AnalysisResult,
  type MotionSpec,
} from "@/lib/contracts/motion";

const MOTION_INTENTS = [
  "entrance",
  "exit",
  "hover",
  "morph",
  "loading",
  "loop",
  "scroll",
  "unknown",
] as const;

const SavedMotionSpecSchema = z.object({
  accessibilityNote: z.string(),
  delayMs: z.number().int().min(0),
  description: z.string(),
  durationMs: z.number().int().min(0),
  easing: z.string(),
  element: z.string(),
  gpuAccelerated: z.boolean(),
  implementationNotes: z.array(z.string()),
  intent: z.enum(MOTION_INTENTS),
  keyframesDetected: z.number().int().min(0),
  loops: z.boolean(),
  performanceScore: z.number().min(0).max(100),
});

const SavedGeneratedOutputSchema = z.object({
  code: z.string(),
  dependencies: z.array(z.string()),
  framework: z.enum(OUTPUT_FRAMEWORKS),
  setupNotes: z.array(z.string()),
  warnings: z.array(z.string()),
});

/**
 * Shape persisted in `project_versions.motion_spec` when an analysis run is
 * saved from the analyzer. Mirrors the server-side `AnalysisResultSchema`
 * (lib/server/gemini.ts) but stays client-importable and tolerates the looser
 * timestamps that round-trip through JSON storage.
 */
const SavedAnalysisResultSchema = z.object({
  assetId: z.string().min(1),
  createdAt: z.string().min(1),
  frameCount: z.number().int().min(1),
  id: z.string().min(1),
  model: z.enum(ANALYSIS_MODELS),
  outputs: z.array(SavedGeneratedOutputSchema).min(1),
  projectId: z.string().min(1),
  spec: SavedMotionSpecSchema,
  versionId: z.string().min(1),
});

/**
 * Parses a saved `motion_spec` payload back into a renderable AnalysisResult.
 * Returns null when the payload predates analyzer auto-save (e.g. a manually
 * pasted spec) so callers can fall back to a spec-only rendering.
 */
export function parseSavedAnalysisResult(value: unknown): AnalysisResult | null {
  const parsed = SavedAnalysisResultSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * Parses a legacy spec-only `motion_spec` payload (versions created before
 * analyzer auto-save stored just the MotionSpec, or arbitrary pasted JSON).
 */
export function parseSavedMotionSpec(value: unknown): MotionSpec | null {
  const parsed = SavedMotionSpecSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
