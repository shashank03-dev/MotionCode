import { handleCreateProjectVersionRequest } from "../../handler";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function POST(request: Request, context: RouteContext) {
  return handleCreateProjectVersionRequest(request, {}, context.params);
}
