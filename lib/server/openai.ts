import { ApiError } from "./apiErrors";
import {
  buildGeminiPrompt,
  normalizeGeminiGeneratedAnalysis,
  type GeminiAnalysis,
} from "./gemini";

const OPENAI_RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses";

export const DEFAULT_OPENAI_ANALYSIS_MODEL = "gpt-5.5" as const;

export type OpenAIAnalysisModel = typeof DEFAULT_OPENAI_ANALYSIS_MODEL;

export type OpenAIAnalyzeInput = {
  frames: string[];
  model: OpenAIAnalysisModel;
};

export type OpenAIClientDeps = {
  apiKey?: string;
  fetch?: typeof fetch;
};

export async function analyzeFramesWithOpenAI(
  input: OpenAIAnalyzeInput,
  deps: OpenAIClientDeps = {},
): Promise<GeminiAnalysis> {
  const apiKey = deps.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ApiError("MODEL_FAILED", "OpenAI API key is not configured.");
  }

  const fetcher = deps.fetch ?? fetch;
  const response = await fetcher(OPENAI_RESPONSES_ENDPOINT, {
    body: JSON.stringify({
      input: [
        {
          content: [
            { text: buildGeminiPrompt(input.frames.length), type: "input_text" },
            ...input.frames.map((frame) => ({
              image_url: `data:image/jpeg;base64,${frame}`,
              type: "input_image",
            })),
          ],
          role: "user",
        },
      ],
      max_output_tokens: 8192,
      model: input.model,
      text: {
        format: {
          name: "motion_analysis",
          schema: OPENAI_MOTION_ANALYSIS_SCHEMA,
          strict: true,
          type: "json_schema",
        },
      },
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new ApiError("MODEL_FAILED", "OpenAI analysis failed.");
  }

  const payload = (await response.json()) as unknown;
  const text = extractOpenAIText(payload);
  const parsed = parseOpenAIJsonText(text);
  return normalizeGeminiGeneratedAnalysis(parsed);
}

const OPENAI_MOTION_ANALYSIS_SCHEMA = {
  additionalProperties: false,
  properties: {
    accessibility_note: { type: "string" },
    css: { type: "string" },
    delay_ms: { type: "integer" },
    description: { type: "string" },
    duration_ms: { type: "integer" },
    easing: { type: "string" },
    element: { type: "string" },
    framer_motion: { type: "string" },
    gpu_accelerated: { type: "boolean" },
    gsap: { type: "string" },
    implementation_notes: {
      items: { type: "string" },
      type: "array",
    },
    intent: {
      enum: [
        "entrance",
        "exit",
        "hover",
        "loading",
        "loop",
        "morph",
        "scroll",
        "unknown",
      ],
      type: "string",
    },
    keyframes_detected: { type: "integer" },
    loops: { type: "boolean" },
    performance_score: { type: "number" },
    react_spring: { type: "string" },
  },
  required: [
    "intent",
    "element",
    "duration_ms",
    "delay_ms",
    "easing",
    "loops",
    "description",
    "keyframes_detected",
    "performance_score",
    "gpu_accelerated",
    "accessibility_note",
    "implementation_notes",
    "css",
    "gsap",
    "framer_motion",
    "react_spring",
  ],
  type: "object",
} as const;

function extractOpenAIText(payload: unknown) {
  const directText = getRecord(payload).output_text;
  if (typeof directText === "string" && directText.trim()) {
    return directText;
  }

  const output = getRecord(payload).output;
  if (!Array.isArray(output)) {
    throw new ApiError("SCHEMA_FAILED", "OpenAI response did not include output.");
  }

  const text = output
    .flatMap((item) => {
      const content = getRecord(item).content;
      return Array.isArray(content) ? content : [];
    })
    .map((content) => getRecord(content).text)
    .filter((part): part is string => typeof part === "string")
    .join("");

  if (!text.trim()) {
    throw new ApiError("SCHEMA_FAILED", "OpenAI response text was empty.");
  }

  return text;
}

function parseOpenAIJsonText(text: string) {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new ApiError("SCHEMA_FAILED", "OpenAI response did not contain JSON.");
  }

  try {
    return JSON.parse(text.slice(firstBrace, lastBrace + 1)) as unknown;
  } catch {
    throw new ApiError("SCHEMA_FAILED", "OpenAI response JSON was invalid.");
  }
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}
