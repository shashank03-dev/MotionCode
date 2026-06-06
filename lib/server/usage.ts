import { FREE_LIMIT } from "@/lib/usageLimits";

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

export const freeUsageLimiter = createDailyUsageLimiter({ limit: FREE_LIMIT });
