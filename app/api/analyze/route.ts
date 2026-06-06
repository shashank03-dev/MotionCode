import { NextResponse } from "next/server";
import { analysisRequestSchema } from "@/app/api/analyze/schema";
import { analyzeFramesWithGemini } from "@/lib/server/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = analysisRequestSchema.parse(body);
    const result = await analyzeFramesWithGemini(input.frames);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
