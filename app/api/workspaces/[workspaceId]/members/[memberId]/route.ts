import { handleUpdateWorkspaceMemberRequest } from "../../../members-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    memberId: string;
    workspaceId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  return handleUpdateWorkspaceMemberRequest(request, {}, await context.params);
}
