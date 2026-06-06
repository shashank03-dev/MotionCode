import { handleStripeWebhookRequest } from "@/lib/server/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleStripeWebhookRequest(request);
}
