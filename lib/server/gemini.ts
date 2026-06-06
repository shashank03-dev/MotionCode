import {
  normalizeAnalysisResult,
  type AnimationAnalysisResult,
} from "@/lib/animationResult";
import { buildAnimationPrompt } from "@/app/api/analyze/prompt";
import { readServerEnv } from "@/lib/server/env";

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: "image/jpeg"; data: string } };

export async function analyzeFramesWithGemini(
  frames: string[],
): Promise<AnimationAnalysisResult> {
  const { geminiApiKey } = readServerEnv();
  const parts: GeminiPart[] = [
    { text: buildAnimationPrompt(frames.length) },
    ...frames.map((data) => ({
      inline_data: {
        mime_type: "image/jpeg" as const,
        data,
      },
    })),
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Gemini request failed");
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string") {
    throw new Error("Gemini returned no text response");
  }

  return normalizeAnalysisResult(JSON.parse(text));
}
