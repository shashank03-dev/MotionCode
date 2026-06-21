import { z } from "zod";

import { PLAN_ENTITLEMENTS } from "@/lib/contracts/plans";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"] as const;
const JPEG_DATA_URL_PREFIX = /^data:image\/jpe?g;base64,/i;
const MAX_PLAN_UPLOAD_BYTES = PLAN_ENTITLEMENTS.studio.maxUploadBytes;
const ResourceIdSchema = z.string().uuid();

export const MAX_ANALYZE_FRAMES =
  PLAN_ENTITLEMENTS.studio.maxFramesPerAnalysis;
export const MAX_FRAME_BASE64_LENGTH =
  Math.ceil((MAX_PLAN_UPLOAD_BYTES * 4) / 3) + "data:image/jpeg;base64,".length;
export const MAX_ANALYZE_REQUEST_CONTENT_LENGTH =
  MAX_FRAME_BASE64_LENGTH + MAX_ANALYZE_FRAMES * 128 + 4096;

export const Base64JpegFrameSchema = z
  .string()
  .min(1)
  .max(MAX_FRAME_BASE64_LENGTH)
  .transform((value) => value.replace(JPEG_DATA_URL_PREFIX, "").replace(/\s/g, ""))
  .superRefine((value, context) => {
    const buffer = decodeBase64(value);

    if (!buffer || !isJpeg(buffer)) {
      context.addIssue({
        code: "custom",
        message: "Frame must be a base64 encoded JPEG.",
      });
    }
  });

export const AnalyzeRequestSchema = z
  .object({
    assetId: ResourceIdSchema.optional(),
    frames: z.array(Base64JpegFrameSchema).min(1).max(MAX_ANALYZE_FRAMES),
    model: z.enum(GEMINI_MODELS).default("gemini-2.5-flash"),
    projectId: ResourceIdSchema.optional(),
    versionId: ResourceIdSchema.optional(),
    workspaceId: ResourceIdSchema.optional(),
  })
  .strict()
  .refine(
    (value) =>
      Boolean(value.assetId) === Boolean(value.projectId) &&
      Boolean(value.projectId) === Boolean(value.versionId),
    {
      message:
        "Saved analysis requests must include assetId, projectId, and versionId.",
    },
  );

export type AnalyzeRequestBody = z.infer<typeof AnalyzeRequestSchema>;

export function calculateFramePayloadBytes(frames: string[]) {
  return frames.reduce((total, frame) => total + Buffer.from(frame, "base64").length, 0);
}

export function hasFrameValidationIssue(error: z.ZodError) {
  return error.issues.some((issue) => issue.path[0] === "frames");
}

function decodeBase64(value: string) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value) || value.length % 4 !== 0) {
    return null;
  }

  const buffer = Buffer.from(value, "base64");
  const normalizedInput = value.replace(/=+$/, "");
  const normalizedOutput = buffer.toString("base64").replace(/=+$/, "");

  return normalizedInput === normalizedOutput ? buffer : null;
}

function isJpeg(buffer: Buffer) {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}
