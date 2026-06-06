import type { ApiResponse } from "@/lib/contracts/errors";
import type { AdminSupportTicketDTO } from "@/lib/contracts/adminSupport";
import { listAdminSupportTickets } from "@/lib/server/adminSupport";
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

    const tickets = await listAdminSupportTickets(decision.context.adminClient);
    return apiSuccess({ tickets });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to load support tickets.");
  }
}

export type AdminSupportTicketsResponse = ApiResponse<{
  tickets: AdminSupportTicketDTO[];
}>;
