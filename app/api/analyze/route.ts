import { handleAnalyzeRequest } from "./handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleAnalyzeRequest(request);
}
