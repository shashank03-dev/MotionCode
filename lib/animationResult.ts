import { z } from "zod";

const numericStringPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

export function numberFromNumericInput(schema: z.ZodNumber) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmedValue = value.trim();

    if (!numericStringPattern.test(trimmedValue)) {
      return value;
    }

    return Number(trimmedValue);
  }, schema);
}

export const animationAnalysisResultSchema = z.object({
  intent: z.string().min(1).max(40),
  element: z.string().min(1).max(80),
  duration_ms: numberFromNumericInput(z.number().int().min(0).max(60_000)),
  delay_ms: numberFromNumericInput(
    z.number().int().min(0).max(60_000),
  ).default(0),
  easing: z.string().min(1).max(120),
  loops: z.boolean().default(false),
  description: z.string().min(1).max(500),
  keyframes_detected: numberFromNumericInput(
    z.number().int().min(0).max(100),
  ).default(0),
  performance_score: numberFromNumericInput(
    z.number().int().min(0).max(100),
  ).default(0),
  gpu_accelerated: z.boolean().default(false),
  accessibility_note: z.string().min(1).max(500).default("Not assessed"),
  css: z.string().max(8_000).default(""),
  gsap: z.string().max(8_000).default(""),
  framer_motion: z.string().max(8_000).default(""),
  react_spring: z.string().max(8_000).default(""),
});

export type AnimationAnalysisResult = z.infer<
  typeof animationAnalysisResultSchema
>;

export function normalizeAnalysisResult(value: unknown): AnimationAnalysisResult {
  return animationAnalysisResultSchema.parse(value);
}
