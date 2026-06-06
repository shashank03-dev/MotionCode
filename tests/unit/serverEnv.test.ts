import { describe, expect, it } from "vitest";
import { readServerEnv, readUsageStoreEnv } from "@/lib/server/env";

describe("readServerEnv", () => {
  it("returns the Gemini API key when present", () => {
    expect(readServerEnv({ GEMINI_API_KEY: "test-key" })).toEqual({
      geminiApiKey: "test-key",
    });
  });

  it("trims the Gemini API key", () => {
    expect(readServerEnv({ GEMINI_API_KEY: " test-key " })).toEqual({
      geminiApiKey: "test-key",
    });
  });

  it("rejects missing Gemini API key", () => {
    expect(() => readServerEnv({})).toThrow("GEMINI_API_KEY is required");
  });

  it("rejects a whitespace-only Gemini API key", () => {
    expect(() => readServerEnv({ GEMINI_API_KEY: "   " })).toThrow(
      "GEMINI_API_KEY is required",
    );
  });
});

describe("readUsageStoreEnv", () => {
  it("allows missing Redis quota config outside production", () => {
    expect(readUsageStoreEnv({ NODE_ENV: "test" })).toEqual({
      upstashRedisRestUrl: undefined,
      upstashRedisRestToken: undefined,
    });
  });

  it("returns complete Redis quota config", () => {
    expect(
      readUsageStoreEnv({
        NODE_ENV: "production",
        UPSTASH_REDIS_REST_URL: " https://example.upstash.io ",
        UPSTASH_REDIS_REST_TOKEN: " token ",
      }),
    ).toEqual({
      upstashRedisRestUrl: "https://example.upstash.io",
      upstashRedisRestToken: "token",
    });
  });

  it("rejects partial Redis quota config", () => {
    expect(() =>
      readUsageStoreEnv({
        NODE_ENV: "production",
        UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      }),
    ).toThrow(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured together",
    );
  });

  it("requires Redis quota config in production", () => {
    expect(() => readUsageStoreEnv({ NODE_ENV: "production" })).toThrow(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production",
    );
  });

  it("rejects invalid Redis REST URLs", () => {
    expect(() =>
      readUsageStoreEnv({
        NODE_ENV: "production",
        UPSTASH_REDIS_REST_URL: "not-a-url",
        UPSTASH_REDIS_REST_TOKEN: "token",
      }),
    ).toThrow("UPSTASH_REDIS_REST_URL must be a valid URL");
  });
});
