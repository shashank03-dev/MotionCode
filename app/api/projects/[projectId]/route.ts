import {
  handleArchiveProjectRequest,
  handleGetProjectRequest,
  handleUpdateProjectRequest,
} from "../handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  return handleGetProjectRequest(request, {}, await context.params);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleUpdateProjectRequest(request, {}, await context.params);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handleArchiveProjectRequest(request, {}, await context.params);
}
