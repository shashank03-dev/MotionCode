import { handleRazorpayWebhookRequest } from "@/lib/server/razorpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRazorpayWebhookRequest(request);
}
