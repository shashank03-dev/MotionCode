type EnvSource = Record<string, string | undefined>;

export type ServerEnv = {
  geminiApiKey: string;
};

export function readServerEnv(source: EnvSource = process.env): ServerEnv {
  const geminiApiKey = source.GEMINI_API_KEY?.trim();

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is required");
  }

  return { geminiApiKey };
}
