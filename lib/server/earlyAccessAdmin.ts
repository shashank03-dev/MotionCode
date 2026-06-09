import { createTrustedSupabaseServerClient } from "@/lib/server/audit";

export type EarlyAccessSignupSummary = {
  createdAt: string;
  desiredPlan: "pro" | "studio";
  email: string | null;
  status: "requested" | "invited" | "converted" | "closed";
  userId: string;
};

type EarlyAccessSignupRow = {
  created_at: string;
  desired_plan: "pro" | "studio";
  email: string | null;
  status: "requested" | "invited" | "converted" | "closed";
  user_id: string;
};

type EarlyAccessReadClient = {
  from: (table: "early_access_signups") => {
    select: (
      columns: string,
      options?: { count?: "exact"; head?: boolean },
    ) => {
      eq: (column: string, value: unknown) => EarlyAccessFilterBuilder;
      order: (
        column: string,
        options: { ascending: boolean },
      ) => EarlyAccessFilterBuilder;
    };
  };
};

type EarlyAccessFilterBuilder = {
  eq: (column: string, value: unknown) => EarlyAccessFilterBuilder;
  limit: (limit: number) => Promise<{
    data: EarlyAccessSignupRow[] | null;
    error: { message?: string } | null;
  }>;
  order: (
    column: string,
    options: { ascending: boolean },
  ) => EarlyAccessFilterBuilder;
};

type EarlyAccessCountClient = {
  from: (table: "early_access_signups") => {
    select: (
      columns: string,
      options: { count: "exact"; head: true },
    ) => {
      eq: (
        column: "status",
        value: "requested",
      ) => Promise<{
        count: number | null;
        error: { message?: string } | null;
      }>;
    };
  };
};

export async function getEarlyAccessForUser(
  userId: string,
): Promise<EarlyAccessSignupSummary[]> {
  const client =
    createTrustedSupabaseServerClient() as unknown as EarlyAccessReadClient;
  const { data, error } = await client
    .from("early_access_signups")
    .select("user_id,email,desired_plan,status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return [];
  }

  return (data ?? []).map(toEarlyAccessSignupSummary);
}

export async function countRequestedEarlyAccessSignups() {
  const client =
    createTrustedSupabaseServerClient() as unknown as EarlyAccessCountClient;
  const { count, error } = await client
    .from("early_access_signups")
    .select("id", { count: "exact", head: true })
    .eq("status", "requested");

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function listRecentEarlyAccessSignups(
  limit = 8,
): Promise<EarlyAccessSignupSummary[]> {
  const client =
    createTrustedSupabaseServerClient() as unknown as EarlyAccessReadClient;
  const { data, error } = await client
    .from("early_access_signups")
    .select("user_id,email,desired_plan,status,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []).map(toEarlyAccessSignupSummary);
}

function toEarlyAccessSignupSummary(
  row: EarlyAccessSignupRow,
): EarlyAccessSignupSummary {
  return {
    createdAt: row.created_at,
    desiredPlan: row.desired_plan,
    email: row.email,
    status: row.status,
    userId: row.user_id,
  };
}
