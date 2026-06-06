import { handleUpdateWorkspaceMemberRequest } from "../../../members-handler";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    memberId: string;
    workspaceId: string;
  };
};

export async function PATCH(request: Request, context: RouteContext) {
  return handleUpdateWorkspaceMemberRequest(request, {}, context.params);
}
