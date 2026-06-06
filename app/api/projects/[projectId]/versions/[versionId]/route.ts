import { handleGetProjectVersionRequest } from "../../../handler";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    projectId: string;
    versionId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  return handleGetProjectVersionRequest(request, {}, await context.params);
}
