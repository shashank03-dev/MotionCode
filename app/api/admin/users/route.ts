import type { ApiResponse } from "@/lib/contracts/errors";
import type { AdminUserDTO } from "@/lib/contracts/adminSupport";
import { listAdminUsers } from "@/lib/server/adminSupport";
import { apiSuccess } from "@/lib/server/apiErrors";
import { resolveInternalAdminContext } from "@/lib/server/internalAdmin";
import {
  apiErrorFromUnknown,
  internalAdminDeniedResponse,
} from "@/lib/server/routeResponses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const decision = await resolveInternalAdminContext();
    if (!decision.ok) {
      return internalAdminDeniedResponse(decision);
    }

    const users = await listAdminUsers(decision.context.adminClient);
    return apiSuccess({ users });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to load admin users.");
  }
}

export type AdminUsersResponse = ApiResponse<{
  users: AdminUserDTO[];
}>;
