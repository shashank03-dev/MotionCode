import type { ApiResponse } from "@/lib/contracts/errors";
import type { AdminDashboardDTO } from "@/lib/contracts/adminSupport";
import { getAdminDashboard } from "@/lib/server/adminSupport";
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

    const dashboard = await getAdminDashboard(decision.context.adminClient);
    return apiSuccess({ dashboard });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to load admin dashboard.");
  }
}

export type AdminDashboardResponse = ApiResponse<{
  dashboard: AdminDashboardDTO;
}>;
