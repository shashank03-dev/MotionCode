import { z } from "zod";

import { apiError, apiSuccess, isApiError } from "@/lib/server/apiErrors";
import { createProjectShareLink } from "@/lib/server/shareLinks";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CreateShareRequestSchema = z
  .object({
    accessMode: z.enum(["read", "comment"]).default("read"),
    expiresAt: z.string().datetime().nullable().optional(),
    includeComments: z.boolean().optional(),
    projectId: z.string().uuid(),
  })
  .strict();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "Request body must be valid JSON.");
  }

  const parsed = CreateShareRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Invalid share link request.");
  }

  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to create a share link.");
  }

  try {
    const result = await createProjectShareLink({
      accessMode: parsed.data.accessMode,
      expiresAt: parsed.data.expiresAt,
      includeComments: parsed.data.includeComments,
      projectId: parsed.data.projectId,
      userId: user.id,
    });
    const url = new URL(`/share/${result.token}`, request.url).toString();

    return apiSuccess(
      {
        ...result.link,
        token: result.token,
        url,
      },
      { status: 201 },
    );
  } catch (error) {
    if (isApiError(error)) {
      return apiError(error.code, error.message, { status: error.status });
    }

    return apiError("INTERNAL_ERROR", "Failed to create share link.");
  }
}
