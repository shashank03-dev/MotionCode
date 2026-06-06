import {
  handleGetWorkspaceRequest,
  handleUpdateWorkspaceRequest,
} from "../handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  return handleGetWorkspaceRequest(request, {}, await context.params);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleUpdateWorkspaceRequest(request, {}, await context.params);
}
