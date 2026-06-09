import { handleEarlyAccessRequest } from "@/lib/server/earlyAccess";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleEarlyAccessRequest(request);
}
