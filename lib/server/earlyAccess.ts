import { z } from "zod";

import { apiError, apiSuccess } from "@/lib/server/apiErrors";
import { createTrustedSupabaseServerClient } from "@/lib/server/audit";
import { getCurrentUser as getSupabaseCurrentUser } from "@/lib/supabase/server";

const EarlyAccessRequestSchema = z.object({
  desiredPlan: z.enum(["pro", "studio"]),
});

type EarlyAccessUser = {
  email?: string | null;
  id: string;
};

type EarlyAccessInput = {
  desiredPlan: "pro" | "studio";
  email?: string | null;
  source: string;
  userId: string;
};

type EarlyAccessSignup = {
  desiredPlan: "pro" | "studio";
  status: "requested" | "invited" | "converted" | "closed";
};

type EarlyAccessDeps = {
  getCurrentUser?: () => Promise<EarlyAccessUser | null>;
  upsertSignup?: (input: EarlyAccessInput) => Promise<EarlyAccessSignup>;
};

type EarlyAccessSignupRow = {
  desired_plan: "pro" | "studio";
  status: "requested" | "invited" | "converted" | "closed";
};

type EarlyAccessUpsertClient = {
  from: (table: "early_access_signups") => {
    upsert: (
      values: Record<string, unknown>,
      options: { onConflict: string },
    ) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: EarlyAccessSignupRow | null;
          error: { message?: string } | null;
        }>;
      };
    };
  };
};

export async function handleEarlyAccessRequest(
  request: Request,
  deps: EarlyAccessDeps = {},
) {
  const getCurrentUser = deps.getCurrentUser ?? getSupabaseCurrentUser;
  const upsertSignup = deps.upsertSignup ?? upsertEarlyAccessSignup;
  const user = await getCurrentUser();

  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to request early access.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_REQUEST", "Request body must be valid JSON.");
  }

  const parsed = EarlyAccessRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_REQUEST", "Choose Pro or Studio early access.");
  }

  try {
    const signup = await upsertSignup({
      desiredPlan: parsed.data.desiredPlan,
      email: user.email,
      source: "pricing",
      userId: user.id,
    });

    return apiSuccess(signup);
  } catch {
    return apiError("INTERNAL_ERROR", "Failed to record early access request.");
  }
}

async function upsertEarlyAccessSignup(
  input: EarlyAccessInput,
): Promise<EarlyAccessSignup> {
  const client =
    createTrustedSupabaseServerClient() as unknown as EarlyAccessUpsertClient;
  const { data, error } = await client
    .from("early_access_signups")
    .upsert(
      {
        desired_plan: input.desiredPlan,
        email: input.email ?? null,
        source: input.source,
        updated_at: new Date().toISOString(),
        user_id: input.userId,
      },
      { onConflict: "user_id,desired_plan" },
    )
    .select("desired_plan,status")
    .single();

  if (error || !data) {
    throw new Error("Failed to record early access request.");
  }

  return {
    desiredPlan: data.desired_plan,
    status: data.status,
  };
}
