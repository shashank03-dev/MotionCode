import { handleGetProjectVersionRequest } from "../../../handler";

export const runtime = "nodejs";

type RouteContext = {
  params: {
    projectId: string;
    versionId: string;
  };
};

export async function GET(request: Request, context: RouteContext) {
  return handleGetProjectVersionRequest(request, {}, context.params);
}
