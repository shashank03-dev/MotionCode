import { z } from "zod";

import { apiError, apiSuccess, isApiError } from "@/lib/server/apiErrors";
import { revokeProjectShareLink } from "@/lib/server/shareLinks";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RevokeShareRequestSchema = z
  .object({
    id: z.string().uuid().optional(),
    shareLinkId: z.string().uuid().optional(),
  })
  .strict()
  .transform((value) => ({
    shareLinkId: value.shareLinkId ?? value.id,
  }))
  .refine((value) => Boolean(value.shareLinkId), {
    message: "shareLinkId is required.",
  });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "Request body must be valid JSON.");
  }

  const parsed = RevokeShareRequestSchema.safeParse(body);
  if (!parsed.success || !parsed.data.shareLinkId) {
    return apiError("INVALID_REQUEST", "Invalid share revoke request.");
  }

  const user = await getCurrentUser();
  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to revoke a share link.");
  }

  try {
    const result = await revokeProjectShareLink({
      shareLinkId: parsed.data.shareLinkId,
      userId: user.id,
    });

    return apiSuccess(result);
  } catch (error) {
    if (isApiError(error)) {
      return apiError(error.code, error.message, { status: error.status });
    }

    return apiError("INTERNAL_ERROR", "Failed to revoke share link.");
  }
}
