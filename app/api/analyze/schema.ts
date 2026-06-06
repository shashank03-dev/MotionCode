import { z } from "zod";
import {
  animationAnalysisResultSchema,
  numberFromNumericInput,
} from "@/lib/animationResult";

export const analysisRequestSchema = z
  .object({
    frames: z.array(z.string().min(1).max(1_000_000)).min(1).max(12),
    frameCount: numberFromNumericInput(z.number().int().min(1).max(12)),
  })
  .refine(({ frames, frameCount }) => frames.length === frameCount, {
    message: "frameCount must match frames length",
    path: ["frameCount"],
  });

export const analysisResponseSchema = animationAnalysisResultSchema;

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type AnalysisResponse = z.infer<typeof analysisResponseSchema>;
