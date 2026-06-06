import { FREE_LIMIT } from "@/lib/usageLimits";
import { readUsageStoreEnv } from "@/lib/server/env";

type UsageRecord = {
  count: number;
  date: string;
};

export type UsageResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
};

export type UsageLimiter = {
  consume(identity: string): Promise<UsageResult>;
};

type UpstashLimiterOptions = {
  limit: number;
  restUrl: string;
  restToken: string;
  now?: () => Date;
  fetcher?: typeof fetch;
};

export function createDailyUsageLimiter(options: {
  limit: number;
  now?: () => Date;
}): UsageLimiter {
  const records = new Map<string, UsageRecord>();
  const now = options.now ?? (() => new Date());

  return {
    async consume(identity: string) {
      const date = now().toISOString().slice(0, 10);
      const existing = records.get(identity);
      const record = existing?.date === date ? existing : { count: 0, date };

      if (record.count >= options.limit) {
        records.set(identity, record);
        return { allowed: false, remaining: 0, limit: options.limit };
      }

      record.count += 1;
      records.set(identity, record);

      return {
        allowed: true,
        remaining: Math.max(0, options.limit - record.count),
        limit: options.limit,
      };
    },
  };
}

function secondsUntilNextUtcDay(date: Date): number {
  const nextDay = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
  );

  return Math.max(1, Math.ceil((nextDay - date.getTime()) / 1000));
}

export function createUpstashDailyUsageLimiter(
  options: UpstashLimiterOptions,
): UsageLimiter {
  const now = options.now ?? (() => new Date());
  const fetcher = options.fetcher ?? fetch;
  const restUrl = options.restUrl.replace(/\/+$/, "");

  return {
    async consume(identity: string) {
      const currentDate = now();
      const date = currentDate.toISOString().slice(0, 10);
      const key = `motioncode:usage:${date}:${identity}`;
      const ttl = secondsUntilNextUtcDay(currentDate);
      const response = await fetcher(`${restUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${options.restToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, ttl],
        ]),
      });

      if (!response.ok) {
        throw new Error("Usage quota store unavailable");
      }

      const payload = await response.json() as Array<{ result?: unknown }>;
      const count = Number(payload[0]?.result);

      if (!Number.isFinite(count)) {
        throw new Error("Usage quota store returned an invalid count");
      }

      return {
        allowed: count <= options.limit,
        remaining: Math.max(0, options.limit - count),
        limit: options.limit,
      };
    },
  };
}

export function createFreeUsageLimiter(
  source: Record<string, string | undefined> = process.env,
): UsageLimiter {
  const usageEnv = readUsageStoreEnv(source);

  if (usageEnv.upstashRedisRestUrl && usageEnv.upstashRedisRestToken) {
    return createUpstashDailyUsageLimiter({
      limit: FREE_LIMIT,
      restUrl: usageEnv.upstashRedisRestUrl,
      restToken: usageEnv.upstashRedisRestToken,
    });
  }

  return createDailyUsageLimiter({ limit: FREE_LIMIT });
}

let cachedFreeUsageLimiter: UsageLimiter | undefined;

export function getFreeUsageLimiter(): UsageLimiter {
  cachedFreeUsageLimiter ??= createFreeUsageLimiter();
  return cachedFreeUsageLimiter;
}
