import { z } from "zod";

const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"] as const;
const JPEG_DATA_URL_PREFIX = /^data:image\/jpe?g;base64,/i;

export const Base64JpegFrameSchema = z
  .string()
  .min(1)
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
    assetId: z.string().min(1),
    frames: z.array(Base64JpegFrameSchema).min(1),
    model: z.enum(GEMINI_MODELS).default("gemini-2.5-flash"),
    projectId: z.string().min(1),
    versionId: z.string().min(1),
    workspaceId: z.string().min(1).optional(),
  })
  .strict();

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
