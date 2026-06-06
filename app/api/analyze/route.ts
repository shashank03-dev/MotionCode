import { NextResponse } from "next/server";
import { analysisRequestSchema } from "@/app/api/analyze/schema";
import { analyzeFramesWithGemini } from "@/lib/server/gemini";
import { freeUsageLimiter } from "@/lib/server/usage";

export const runtime = "nodejs";

const IDENTITY_HEADERS = [
  "x-vercel-forwarded-for",
  "x-real-ip",
  "x-forwarded-for",
] as const;

function identityFromRequest(request: Request): string {
  for (const header of IDENTITY_HEADERS) {
    const identity = firstHeaderValue(request.headers.get(header));

    if (identity) {
      return identity;
    }
  }

  return "anonymous";
}

function firstHeaderValue(value: string | null): string | undefined {
  // This is cost throttling, not authentication; direct callers can spoof
  // forwarding headers until a real user identity is introduced.
  return value?.split(",")[0]?.trim() || undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = analysisRequestSchema.parse(body);
    const usage = await freeUsageLimiter.consume(identityFromRequest(request));

    if (!usage.allowed) {
      return NextResponse.json(
        {
          error: "Daily analysis limit reached.",
          limit: usage.limit,
          remaining: usage.remaining,
        },
        { status: 429 },
      );
    }

    const result = await analyzeFramesWithGemini(input.frames);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
