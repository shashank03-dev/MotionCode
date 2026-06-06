import { z } from "zod";

import {
  OUTPUT_FRAMEWORKS,
  type AnalysisResult,
  type GeneratedOutput,
  type MotionIntent,
  type MotionSpec,
  type OutputFramework,
} from "@/lib/contracts/motion";

import { ApiError } from "./apiErrors";
import { getServerEnv } from "./env";

const GEMINI_ENDPOINT_ROOT =
  "https://generativelanguage.googleapis.com/v1beta/models";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"] as const;

const MOTION_INTENTS: MotionIntent[] = [
  "entrance",
  "exit",
  "hover",
  "loading",
  "loop",
  "morph",
  "scroll",
  "unknown",
];

export const MotionSpecSchema = z.object({
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

export const GeneratedOutputSchema = z.object({
  code: z.string(),
  dependencies: z.array(z.string()),
  framework: z.enum(OUTPUT_FRAMEWORKS),
  setupNotes: z.array(z.string()),
  warnings: z.array(z.string()),
});

export const AnalysisResultSchema = z.object({
  assetId: z.string().min(1),
  createdAt: z.string().datetime(),
  frameCount: z.number().int().min(1),
  id: z.string().min(1),
  model: z.enum(GEMINI_MODELS),
  outputs: z.array(GeneratedOutputSchema).min(1),
  projectId: z.string().min(1),
  spec: MotionSpecSchema,
  versionId: z.string().min(1),
});

const RawGeminiAnalysisSchema = z
  .object({
    accessibility_note: z.string().optional(),
    accessibilityNote: z.string().optional(),
    css: z.string().optional(),
    delay_ms: z.number().optional(),
    delayMs: z.number().optional(),
    description: z.string().optional(),
    duration_ms: z.number().optional(),
    durationMs: z.number().optional(),
    easing: z.string().optional(),
    element: z.string().optional(),
    framer_motion: z.string().optional(),
    framerMotion: z.string().optional(),
    gpu_accelerated: z.boolean().optional(),
    gpuAccelerated: z.boolean().optional(),
    gsap: z.string().optional(),
    implementation_notes: z.array(z.string()).optional(),
    implementationNotes: z.array(z.string()).optional(),
    intent: z.string().optional(),
    keyframes_detected: z.number().optional(),
    keyframesDetected: z.number().optional(),
    loops: z.boolean().optional(),
    performance_score: z.number().optional(),
    performanceScore: z.number().optional(),
    react_spring: z.string().optional(),
    reactSpring: z.string().optional(),
  })
  .passthrough();

export type GeminiModel = (typeof GEMINI_MODELS)[number];

export type GeminiAnalysis = {
  outputs: GeneratedOutput[];
  spec: MotionSpec;
};

export type GeminiAnalyzeInput = {
  frames: string[];
  model: GeminiModel;
};

export type GeminiClientDeps = {
  apiKey?: string;
  fetch?: typeof fetch;
};

export type NormalizeAnalysisContext = {
  assetId: string;
  createdAt: string;
  frameCount: number;
  id: string;
  model: GeminiModel;
  projectId: string;
  versionId: string;
};

export function buildGeminiPrompt(frameCount: number) {
  return `You are a frontend animation engineer analyzing ${frameCount} JPEG frames.

Return only raw JSON. Do not include markdown, comments, or prose.

Use this exact shape:
{
  "intent": "entrance|exit|hover|morph|loading|loop|scroll|unknown",
  "element": "short target element name",
  "duration_ms": 400,
  "delay_ms": 0,
  "easing": "cubic-bezier(0.4, 0, 0.2, 1)",
  "loops": false,
  "description": "One concise sentence describing the motion.",
  "keyframes_detected": ${frameCount},
  "performance_score": 90,
  "gpu_accelerated": true,
  "accessibility_note": "Reduced-motion guidance.",
  "implementation_notes": ["One concise implementation note."],
  "css": "CSS implementation string",
  "gsap": "GSAP implementation string",
  "framer_motion": "Framer Motion implementation string",
  "react_spring": "React Spring implementation string"
}`;
}

export async function analyzeFramesWithGemini(
  input: GeminiAnalyzeInput,
  deps: GeminiClientDeps = {},
): Promise<GeminiAnalysis> {
  const apiKey = deps.apiKey ?? getServerEnv().geminiApiKey;
  const fetcher = deps.fetch ?? fetch;
  const response = await fetcher(
    `${GEMINI_ENDPOINT_ROOT}/${input.model}:generateContent`,
    {
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: buildGeminiPrompt(input.frames.length) },
              ...input.frames.map((frame) => ({
                inline_data: {
                  data: frame,
                  mime_type: "image/jpeg",
                },
              })),
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.1,
        },
      }),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new ApiError("MODEL_FAILED", "Gemini analysis failed.");
  }

  const payload = (await response.json()) as unknown;
  const text = extractGeminiText(payload);
  const parsed = parseGeminiJsonText(text);
  return normalizeGeminiGeneratedAnalysis(parsed);
}

export function normalizeGeminiGeneratedAnalysis(input: unknown): GeminiAnalysis {
  const raw = RawGeminiAnalysisSchema.parse(input);
  const spec = MotionSpecSchema.parse({
    accessibilityNote: stringValue(
      raw.accessibilityNote,
      raw.accessibility_note,
      "Add prefers-reduced-motion fallback.",
    ),
    delayMs: nonNegativeInteger(numberValue(raw.delayMs, raw.delay_ms, 0)),
    description: stringValue(
      raw.description,
      "Motion pattern detected from sampled frames.",
    ),
    durationMs: nonNegativeInteger(numberValue(raw.durationMs, raw.duration_ms, 300)),
    easing: stringValue(raw.easing, "ease-out"),
    element: stringValue(raw.element, "element"),
    gpuAccelerated: booleanValue(raw.gpuAccelerated, raw.gpu_accelerated, true),
    implementationNotes: arrayValue(
      raw.implementationNotes,
      raw.implementation_notes,
      [],
    ),
    intent: normalizeIntent(raw.intent),
    keyframesDetected: nonNegativeInteger(
      numberValue(raw.keyframesDetected, raw.keyframes_detected, 0),
    ),
    loops: booleanValue(raw.loops, false),
    performanceScore: clamp(numberValue(raw.performanceScore, raw.performance_score, 80), 0, 100),
  });

  const outputs = GeneratedOutputSchema.array().parse([
    output("css", stringValue(raw.css, ""), [], []),
    output("gsap", stringValue(raw.gsap, ""), ["gsap"], []),
    output(
      "framer-motion",
      stringValue(raw.framerMotion, raw.framer_motion, ""),
      ["framer-motion"],
      [],
    ),
    output(
      "react-spring",
      stringValue(raw.reactSpring, raw.react_spring, ""),
      ["@react-spring/web"],
      [],
    ),
  ]);

  return { outputs, spec };
}

export function normalizeGeminiAnalysis(
  input: unknown,
  context: NormalizeAnalysisContext,
): AnalysisResult {
  const generated = normalizeGeminiGeneratedAnalysis(input);
  return AnalysisResultSchema.parse({
    ...context,
    outputs: generated.outputs,
    spec: generated.spec,
  });
}

function extractGeminiText(payload: unknown) {
  const candidates = getRecord(payload).candidates;
  if (!Array.isArray(candidates)) {
    throw new ApiError("SCHEMA_FAILED", "Gemini response did not include candidates.");
  }

  const firstCandidate = getRecord(candidates[0]);
  const parts = getRecord(firstCandidate.content).parts;
  if (!Array.isArray(parts)) {
    throw new ApiError("SCHEMA_FAILED", "Gemini response did not include text parts.");
  }

  const text = parts
    .map((part) => getRecord(part).text)
    .filter((part): part is string => typeof part === "string")
    .join("");

  if (!text.trim()) {
    throw new ApiError("SCHEMA_FAILED", "Gemini response text was empty.");
  }

  return text;
}

function parseGeminiJsonText(text: string) {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new ApiError("SCHEMA_FAILED", "Gemini response did not contain JSON.");
  }

  const candidate = text.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    const recovered = recoverJsonObject(candidate);
    try {
      return JSON.parse(recovered) as unknown;
    } catch {
      throw new ApiError("SCHEMA_FAILED", "Gemini response JSON was invalid.");
    }
  }
}

function recoverJsonObject(candidate: string) {
  const withoutTrailingCommas = candidate.replace(/,\s*([}\]])/g, "$1").trim();
  const openBraces = withoutTrailingCommas.match(/{/g)?.length ?? 0;
  const closeBraces = withoutTrailingCommas.match(/}/g)?.length ?? 0;

  if (openBraces > closeBraces) {
    return `${withoutTrailingCommas}${"}".repeat(openBraces - closeBraces)}`;
  }

  return withoutTrailingCommas;
}

function output(
  framework: OutputFramework,
  code: string,
  dependencies: string[],
  warnings: string[],
): GeneratedOutput {
  return {
    code,
    dependencies,
    framework,
    setupNotes: [],
    warnings,
  };
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function numberValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

function booleanValue(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }
  }

  return false;
}

function arrayValue(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }
  }

  return [];
}

function normalizeIntent(value: unknown): MotionIntent {
  return MOTION_INTENTS.includes(value as MotionIntent)
    ? (value as MotionIntent)
    : "unknown";
}

function nonNegativeInteger(value: number) {
  return Math.max(0, Math.round(value));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
