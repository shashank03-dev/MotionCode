type EnvSource = Record<string, string | undefined>;

export type ServerEnv = {
  geminiApiKey: string;
};

export type UsageStoreEnv = {
  upstashRedisRestUrl?: string;
  upstashRedisRestToken?: string;
};

export function readServerEnv(source: EnvSource = process.env): ServerEnv {
  const geminiApiKey = source.GEMINI_API_KEY?.trim();

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is required");
  }

  return { geminiApiKey };
}

export function readUsageStoreEnv(
  source: EnvSource = process.env,
): UsageStoreEnv {
  const upstashRedisRestUrl = source.UPSTASH_REDIS_REST_URL?.trim();
  const upstashRedisRestToken = source.UPSTASH_REDIS_REST_TOKEN?.trim();
  const hasPartialConfig = Boolean(upstashRedisRestUrl) !== Boolean(upstashRedisRestToken);

  if (hasPartialConfig) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured together",
    );
  }

  if (source.NODE_ENV === "production" && !upstashRedisRestUrl) {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production",
    );
  }

  if (upstashRedisRestUrl) {
    try {
      new URL(upstashRedisRestUrl);
    } catch {
      throw new Error("UPSTASH_REDIS_REST_URL must be a valid URL");
    }
  }

  return {
    upstashRedisRestUrl,
    upstashRedisRestToken,
  };
}
