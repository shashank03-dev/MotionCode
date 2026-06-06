"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  createSupabaseAuditRecorder,
  createTrustedSupabaseServerClient,
  recordAuditEvent,
} from "@/lib/server/audit";
import { getCurrentUser } from "@/lib/supabase/server";

type RequestKind = "account_deletion" | "data_export";

const REQUEST_COPY: Record<
  RequestKind,
  { auditEvent: string; redirectValue: string; subject: string; body: string }
> = {
  account_deletion: {
    auditEvent: "account.deletion.requested",
    body:
      "The user requested account deletion from account settings. Review billing, retention, and legal obligations before processing.",
    redirectValue: "account-deletion",
    subject: "Account deletion request",
  },
  data_export: {
    auditEvent: "account.data_export.requested",
    body:
      "The user requested a data export from account settings. Prepare profile, project, usage, billing, and audit data covered by the retention policy.",
    redirectValue: "data-export",
    subject: "Data export request",
  },
};

export async function requestDataExportAction() {
  await createAccountRequest("data_export");
}

export async function requestAccountDeletionAction() {
  await createAccountRequest("account_deletion");
}

async function createAccountRequest(kind: RequestKind) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/account?auth=required");
  }

  const request = REQUEST_COPY[kind];
  const client = createTrustedSupabaseServerClient();
  const result = await client.from("support_tickets").insert({
    body: request.body,
    subject: request.subject,
    user_id: user.id,
  });

  if (result.error) {
    throw new Error("Failed to create support ticket.");
  }

  await recordAuditEvent(createSupabaseAuditRecorder({ client }), {
    actorId: user.id,
    eventType: request.auditEvent,
    metadata: {
      requestedAt: new Date().toISOString(),
    },
    targetType: "support_ticket",
  });

  revalidatePath("/account");
  redirect(`/account?request=${request.redirectValue}`);
}
