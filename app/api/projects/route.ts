import {
  handleCreateProjectRequest,
  handleListProjectsRequest,
} from "./handler";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleListProjectsRequest(request);
}

export async function POST(request: Request) {
  return handleCreateProjectRequest(request);
}
