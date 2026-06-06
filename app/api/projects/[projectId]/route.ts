import {
  handleArchiveProjectRequest,
  handleGetProjectRequest,
  handleUpdateProjectRequest,
} from "../handler";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function GET(request: Request, context: RouteContext) {
  return handleGetProjectRequest(request, {}, context.params);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleUpdateProjectRequest(request, {}, context.params);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handleArchiveProjectRequest(request, {}, context.params);
}
