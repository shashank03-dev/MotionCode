import { handleCreateProjectVersionRequest } from "../../handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  return handleCreateProjectVersionRequest(request, {}, await context.params);
}
