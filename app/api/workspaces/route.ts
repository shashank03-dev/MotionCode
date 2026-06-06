import {
  handleCreateWorkspaceRequest,
  handleListWorkspacesRequest,
} from "./handler";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleListWorkspacesRequest(request);
}

export async function POST(request: Request) {
  return handleCreateWorkspaceRequest(request);
}
