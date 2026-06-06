import { z } from "zod";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { AdminPlanOverrideDTO } from "@/lib/contracts/adminSupport";
import {
  AdminPlanOverrideCreateSchema,
  createAdminPlanOverride,
} from "@/lib/server/adminSupport";
import { apiError, apiSuccess, ApiError } from "@/lib/server/apiErrors";
import { resolveInternalAdminContext } from "@/lib/server/internalAdmin";
import {
  apiErrorFromUnknown,
  internalAdminDeniedResponse,
} from "@/lib/server/routeResponses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const targetUserId = z.string().uuid().safeParse(userId);
    if (!targetUserId.success) {
      return apiError("INVALID_REQUEST", "User ID must be a UUID.");
    }

    const decision = await resolveInternalAdminContext();
    if (!decision.ok) {
      return internalAdminDeniedResponse(decision);
    }

    const input = AdminPlanOverrideCreateSchema.parse(await readJson(request));
    const override = await createAdminPlanOverride(
      decision.context.adminClient,
      decision.context.user.id,
      targetUserId.data,
      input,
    );

    return apiSuccess({ override }, { status: 201 });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to create plan override.");
  }
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
  }
}

export type AdminPlanOverrideCreateResponse = ApiResponse<{
  override: AdminPlanOverrideDTO;
}>;
