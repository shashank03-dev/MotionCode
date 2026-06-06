import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { analysisRequestSchema } from "@/app/api/analyze/schema";
import { publicErrorMessage } from "@/lib/server/errors";
import { analyzeFramesWithGemini } from "@/lib/server/gemini";
import { getFreeUsageLimiter } from "@/lib/server/usage";

export const runtime = "nodejs";

const VERCEL_IDENTITY_HEADERS = ["x-vercel-forwarded-for"] as const;
const LOCAL_IDENTITY_HEADERS = [
  "x-vercel-forwarded-for",
  "x-real-ip",
  "x-forwarded-for",
] as const;

function identityFromRequest(request: Request): string {
  const headers =
    process.env.VERCEL === "1"
      ? VERCEL_IDENTITY_HEADERS
      : process.env.NODE_ENV !== "production"
        ? LOCAL_IDENTITY_HEADERS
      : [];

  for (const header of headers) {
    const identity = firstHeaderValue(request.headers.get(header));

    if (identity) {
      return hashIdentity(identity);
    }
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Trusted request identity is required for quota enforcement");
  }

  return hashIdentity("anonymous");
}

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

function hashIdentity(identity: string): string {
  return createHash("sha256").update(identity).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = analysisRequestSchema.parse(body);
    const usage = await getFreeUsageLimiter().consume(identityFromRequest(request));

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
    console.error("[analyze]", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: publicErrorMessage(error) },
      { status: 400 },
    );
  }
}
