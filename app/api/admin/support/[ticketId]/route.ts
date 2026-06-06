import { z } from "zod";

import type { ApiResponse } from "@/lib/contracts/errors";
import type { AdminSupportTicketDTO } from "@/lib/contracts/adminSupport";
import {
  AdminSupportTicketUpdateSchema,
  updateAdminSupportTicket,
} from "@/lib/server/adminSupport";
import { apiError, apiSuccess, ApiError } from "@/lib/server/apiErrors";
import { resolveInternalAdminContext } from "@/lib/server/internalAdmin";
import {
  apiErrorFromUnknown,
  internalAdminDeniedResponse,
} from "@/lib/server/routeResponses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { ticketId: string } },
) {
  try {
    const ticketId = z.string().uuid().safeParse(params.ticketId);
    if (!ticketId.success) {
      return apiError("INVALID_REQUEST", "Ticket ID must be a UUID.");
    }

    const decision = await resolveInternalAdminContext();
    if (!decision.ok) {
      return internalAdminDeniedResponse(decision);
    }

    const input = AdminSupportTicketUpdateSchema.parse(await readJson(request));
    const ticket = await updateAdminSupportTicket(
      decision.context.adminClient,
      decision.context.user.id,
      ticketId.data,
      input,
    );

    return apiSuccess({ ticket });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to update support ticket.");
  }
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
  }
}

export type AdminSupportTicketUpdateResponse = ApiResponse<{
  ticket: AdminSupportTicketDTO;
}>;
