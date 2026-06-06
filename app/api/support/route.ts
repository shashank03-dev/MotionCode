import type { ApiResponse } from "@/lib/contracts/errors";
import type { SupportTicketDTO } from "@/lib/contracts/adminSupport";
import {
  createSupportTicket,
  listOwnSupportTickets,
  SupportTicketCreateSchema,
} from "@/lib/server/adminSupport";
import { apiError, apiSuccess, ApiError } from "@/lib/server/apiErrors";
import { observeAuthError } from "@/lib/server/observability";
import { apiErrorFromUnknown } from "@/lib/server/routeResponses";
import {
  createSupabaseServerClient,
  getCurrentUser,
} from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const user = await getCurrentUser(supabase);
    if (!user) {
      await observeAuthError({
        action: "support_list",
        reason: "missing_session",
        route: "/api/support",
      });

      return apiError("UNAUTHENTICATED", "Sign in to view support tickets.");
    }

    const tickets = await listOwnSupportTickets(supabase, user.id);
    return apiSuccess({ tickets });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to read support tickets.");
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const user = await getCurrentUser(supabase);
    if (!user) {
      await observeAuthError({
        action: "support_create",
        reason: "missing_session",
        route: "/api/support",
      });

      return apiError("UNAUTHENTICATED", "Sign in to create a support ticket.");
    }

    const input = SupportTicketCreateSchema.parse(await readJson(request));
    const ticket = await createSupportTicket(supabase, user.id, input);

    return apiSuccess({ ticket }, { status: 201 });
  } catch (error) {
    return apiErrorFromUnknown(error, "Failed to create support ticket.");
  }
}

async function readJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new ApiError("INVALID_REQUEST", "Request body must be valid JSON.");
  }
}

export type SupportTicketsResponse = ApiResponse<{
  tickets: SupportTicketDTO[];
}>;

export type SupportTicketCreateResponse = ApiResponse<{
  ticket: SupportTicketDTO;
}>;
