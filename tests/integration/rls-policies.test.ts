import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REQUIRED_TABLES = [
  "profiles",
  "workspaces",
  "workspace_members",
  "projects",
  "project_versions",
  "assets",
  "analyses",
  "generated_outputs",
  "usage_events",
  "subscriptions",
  "billing_webhook_events",
  "share_links",
  "project_comments",
  "support_tickets",
  "audit_events",
  "admin_plan_overrides",
  "team_members",
] as const;

function readMigrationSql() {
  const migrationsDir = join(process.cwd(), "supabase", "migrations");
  if (!existsSync(migrationsDir)) {
    return "";
  }

  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(join(migrationsDir, file), "utf8"))
    .join("\n");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function policyBlock(sql: string, policyName: string) {
  const match = sql.match(
    new RegExp(
      `create policy "${escapeRegExp(policyName)}"[\\s\\S]*?(?=\\n\\ncreate policy|\\n\\ncreate|$)`,
      "i",
    ),
  );

  return match?.[0] ?? "";
}

function tableBlock(sql: string, tableName: string) {
  const match = sql.match(
    new RegExp(
      `create table if not exists public\\.${escapeRegExp(tableName)} \\([\\s\\S]*?\\n\\);`,
      "i",
    ),
  );

  return match?.[0] ?? "";
}

function statementIndex(sql: string, statement: RegExp) {
  const match = statement.exec(sql);

  return match?.index ?? -1;
}

function withoutApprovedLegacyBillingCleanup(sql: string) {
  return sql
    .replace(
      /\balter table public\.profiles\s+drop constraint if exists profiles_stripe_customer_id_key;\s*/gi,
      "",
    )
    .replace(
      /\bdrop index if exists public\.profiles_stripe_customer_id_idx;\s*/gi,
      "",
    )
    .replace(
      /\balter table public\.profiles\s+drop column if exists stripe_customer_id;\s*/gi,
      "",
    )
    .replace(
      /\balter table public\.subscriptions\s+drop constraint if exists subscriptions_stripe_customer_id_key,\s*drop constraint if exists subscriptions_stripe_subscription_id_key,\s*drop column if exists stripe_customer_id,\s*drop column if exists stripe_subscription_id;\s*/gi,
      "",
    )
    .replace(
      /\balter table public\.billing_webhook_events\s+alter column processed_at drop not null,\s*alter column processed_at drop default;\s*/gi,
      "",
    )
    // Approved (20260629160000): the redundant NOT VALID duplicate of
    // subscriptions_payment_provider_check.
    .replace(
      /\balter table public\.subscriptions\s+drop constraint if exists subscriptions_payment_provider_razorpay_only_check;\s*/gi,
      "",
    )
    // Approved (20260629160100): removal of orphaned, empty, unreferenced
    // legacy tables (guarded so it refuses to run against populated tables).
    .replace(
      /\bdrop table if exists public\.(analysis_frames|animation_analyses|generated_code_outputs|export_events|feedback_messages|user_usage_daily|billing_entitlements) cascade;\s*/gi,
      "",
    );
}

describe("Supabase data foundation migration", () => {
  const sql = readMigrationSql();

  it("creates every required public table with RLS enabled", () => {
    for (const table of REQUIRED_TABLES) {
      expect(sql).toMatch(
        new RegExp(`create table if not exists public\\.${table}\\b`, "i"),
      );
      expect(sql).toMatch(
        new RegExp(
          `alter table public\\.${table}\\s+enable row level security`,
          "i",
        ),
      );
    }
  });

  it("keeps the migration free of approval-gated destructive SQL", () => {
    const reviewedSql = withoutApprovedLegacyBillingCleanup(sql);

    expect(reviewedSql).not.toMatch(/\bdelete\s+from\b/i);
    expect(reviewedSql).not.toMatch(/\btruncate\b/i);
    expect(reviewedSql).not.toMatch(/\bdrop\s+/i);
    expect(reviewedSql).not.toMatch(/\balter\s+table\b[\s\S]*?\bdrop\b/i);
  });

  it("revokes broad public table privileges before applying narrow grants", () => {
    const revokeTables = statementIndex(
      sql,
      /revoke all on all tables in schema public from anon, authenticated;/i,
    );
    const revokeSequences = statementIndex(
      sql,
      /revoke all on all sequences in schema public from anon, authenticated;/i,
    );
    const firstPositiveGrant = statementIndex(
      sql,
      /grant usage on schema public to authenticated;/i,
    );

    expect(revokeTables).toBeGreaterThan(-1);
    expect(revokeSequences).toBeGreaterThan(-1);
    expect(firstPositiveGrant).toBeGreaterThan(-1);
    expect(revokeTables).toBeLessThan(firstPositiveGrant);
    expect(revokeSequences).toBeLessThan(firstPositiveGrant);
    expect(sql).not.toMatch(/\bgrant\b[\s\S]*\bto anon\b/i);
  });

  it("enforces plan tiers and role/status check constraints", () => {
    const workspaceMembersTable = tableBlock(sql, "workspace_members");
    const teamMembersTable = tableBlock(sql, "team_members");

    expect(sql).toMatch(
      /profiles[\s\S]*plan_tier[\s\S]*check[\s\S]*'free'[\s\S]*'pro'[\s\S]*'studio'/i,
    );
    expect(workspaceMembersTable).toMatch(/role[\s\S]*check[\s\S]*'admin'[\s\S]*'member'/i);
    expect(workspaceMembersTable).not.toMatch(/'owner'/i);
    expect(teamMembersTable).toMatch(/role[\s\S]*check[\s\S]*'admin'[\s\S]*'member'/i);
    expect(teamMembersTable).not.toMatch(/'owner'/i);
    expect(sql).toMatch(
      /support_tickets[\s\S]*status[\s\S]*check[\s\S]*'open'[\s\S]*'pending'[\s\S]*'closed'/i,
    );
  });

  it("keeps workspace reads scoped to members", () => {
    const readWorkspacesPolicy = policyBlock(
      sql,
      "authenticated users can read workspaces",
    );

    expect(sql).toMatch(/create policy "authenticated users can read workspaces"/i);
    expect(readWorkspacesPolicy).toMatch(/private\.is_workspace_member/i);
    expect(readWorkspacesPolicy).not.toMatch(/private\.is_internal_admin/i);
  });

  it("keeps private project reads scoped to owners and studio members", () => {
    const readProjectsPolicy = policyBlock(
      sql,
      "authenticated users can read projects",
    );

    expect(sql).toMatch(/create policy "authenticated users can read projects"/i);
    expect(readProjectsPolicy).toMatch(/private\.can_read_project/i);
    expect(sql).toMatch(
      /private\.can_read_project[\s\S]*projects\.owner_id = _user_id[\s\S]*workspaces\.plan_tier = 'studio'[\s\S]*private\.is_workspace_member/i,
    );
    expect(readProjectsPolicy).not.toMatch(/private\.is_internal_admin/i);
  });

  it("does not expose share links through broad anonymous table policies", () => {
    expect(sql).toMatch(
      /alter table public\.share_links\s+enable row level security/i,
    );
    expect(sql).not.toMatch(
      /create policy\s+"[^"]+"\s+on public\.share_links[\s\S]*?\bto anon\b/i,
    );
    expect(sql).toMatch(
      /create policy "authenticated users can read their share links"/i,
    );
  });

  it("keeps share link creation and revocation server-route only", () => {
    expect(sql).not.toMatch(
      /grant\s+insert\s+on[^;]*public\.share_links[^;]*to authenticated;/i,
    );
    expect(sql).not.toMatch(
      /grant\s+update[^;]*on public\.share_links\s+to authenticated;/i,
    );
    expect(sql).not.toMatch(
      /create policy\s+"[^"]+"\s+on public\.share_links\s+for insert\s+to authenticated/i,
    );
    expect(sql).not.toMatch(
      /create policy\s+"[^"]+"\s+on public\.share_links\s+for update\s+to authenticated/i,
    );
  });


  it("prevents profile billing identity spoofing through client inserts", () => {
    expect(sql).toMatch(
      /alter policy "authenticated users can create their profile"[\s\S]*razorpay_customer_id is null/i,
    );
    expect(sql).toMatch(
      /drop column if exists stripe_customer_id/i,
    );
    expect(sql).toMatch(
      /drop column if exists stripe_subscription_id/i,
    );
  });

  it("prevents workspace member role escalation through client RLS", () => {
    const insertMembersPolicy = policyBlock(
      sql,
      "workspace owners and admins can invite members",
    );
    const updateMembersPolicy = policyBlock(
      sql,
      "workspace owners can update members",
    );
    const removeMembersPolicy = policyBlock(
      sql,
      "workspace owners and admins can remove members",
    );

    expect(sql).toMatch(/create or replace function private\.is_workspace_owner/i);
    expect(sql).toMatch(/create or replace function private\.is_workspace_admin/i);
    expect(insertMembersPolicy).toMatch(/private\.is_workspace_owner/i);
    expect(insertMembersPolicy).toMatch(/private\.is_workspace_admin[\s\S]*role = 'member'/i);
    expect(insertMembersPolicy).not.toMatch(/role = 'admin'[\s\S]*private\.is_workspace_admin/i);
    expect(updateMembersPolicy).toMatch(/private\.is_workspace_owner/i);
    expect(updateMembersPolicy).not.toMatch(/private\.is_workspace_admin/i);
    expect(removeMembersPolicy).toMatch(/private\.is_workspace_owner/i);
    expect(removeMembersPolicy).toMatch(/private\.is_workspace_admin[\s\S]*role = 'member'/i);
  });

  it("prevents team member compatibility role escalation through client RLS", () => {
    const insertMembersPolicy = policyBlock(
      sql,
      "workspace owners and admins can invite team members",
    );
    const updateMembersPolicy = policyBlock(
      sql,
      "workspace owners can update team members",
    );
    const removeMembersPolicy = policyBlock(
      sql,
      "workspace owners and admins can remove team members",
    );

    expect(insertMembersPolicy).toMatch(/private\.is_workspace_owner/i);
    expect(insertMembersPolicy).toMatch(/private\.is_workspace_admin[\s\S]*role = 'member'/i);
    expect(updateMembersPolicy).toMatch(/private\.is_workspace_owner/i);
    expect(updateMembersPolicy).not.toMatch(/private\.is_workspace_admin/i);
    expect(removeMembersPolicy).toMatch(/private\.is_workspace_owner/i);
    expect(removeMembersPolicy).toMatch(/private\.is_workspace_admin[\s\S]*role = 'member'/i);
  });

  it("enforces cross-project relationships that simple foreign keys cannot express", () => {
    expect(sql).toMatch(
      /create or replace function private\.ensure_project_latest_version_matches/i,
    );
    expect(sql).toMatch(/create trigger projects_latest_version_matches/i);
    expect(sql).toMatch(
      /create or replace function private\.ensure_analysis_version_matches/i,
    );
    expect(sql).toMatch(/create trigger analyses_version_matches/i);
    expect(sql).toMatch(
      /create or replace function private\.ensure_generated_output_analysis_matches/i,
    );
    expect(sql).toMatch(/create trigger generated_outputs_analysis_matches/i);
  });

  it("enforces saved project caps at the direct projects insert policy", () => {
    expect(sql).toMatch(/create or replace function private\.can_create_project/i);
    expect(sql).toMatch(
      /create or replace function private\.active_saved_project_count/i,
    );
    expect(sql).toMatch(
      /create or replace function private\.user_saved_project_limit/i,
    );
    expect(sql).toMatch(
      /status in \('draft', 'uploaded', 'analyzing', 'generated'\)/i,
    );
    expect(sql).toMatch(
      /alter policy "workspace members can create projects"[\s\S]*private\.can_create_project/i,
    );
  });

  it("keeps server-owned analysis, output, and usage writes out of direct client grants", () => {
    for (const table of ["analyses", "generated_outputs", "usage_events"]) {
      expect(sql).not.toMatch(
        new RegExp(
          `grant\\s+insert\\s+on[^;]*public\\.${table}[^;]*to authenticated;`,
          "i",
        ),
      );
      expect(sql).not.toMatch(
        new RegExp(
          `grant\\s+update[^;]*on public\\.${table}\\s+to authenticated;`,
          "i",
        ),
      );
      expect(sql).not.toMatch(
        new RegExp(
          `create policy\\s+"[^"]+"\\s+on public\\.${table}\\s+for insert\\s+to authenticated`,
          "i",
        ),
      );
      expect(sql).not.toMatch(
        new RegExp(
          `create policy\\s+"[^"]+"\\s+on public\\.${table}\\s+for update\\s+to authenticated`,
          "i",
        ),
      );
    }
  });

  it("limits support ticket direct writes to ticket creation fields only", () => {
    expect(sql).toMatch(
      /grant insert \(user_id, subject, body\) on public\.support_tickets to authenticated;/i,
    );
    expect(sql).not.toMatch(
      /grant\s+insert\s+on[^;]*public\.support_tickets[^;]*to authenticated;/i,
    );
    expect(sql).not.toMatch(
      /grant\s+update[^;]*on public\.support_tickets\s+to authenticated;/i,
    );
    expect(sql).not.toMatch(
      /create policy\s+"[^"]+"\s+on public\.support_tickets\s+for update\s+to authenticated/i,
    );
  });

  it("keeps audit events append-only through server helpers", () => {
    expect(sql).toMatch(/comment on table public\.audit_events/i);
    expect(sql).not.toMatch(
      /create policy\s+"[^"]+"\s+on public\.audit_events\s+for insert\s+to authenticated/i,
    );
    expect(sql).not.toMatch(
      /create policy\s+"[^"]+"\s+on public\.audit_events\s+for update/i,
    );
    expect(sql).not.toMatch(
      /create policy\s+"[^"]+"\s+on public\.audit_events\s+for delete/i,
    );
  });

  it("limits atomic analysis usage reservation execution to server role", () => {
    expect(sql).toMatch(
      /create or replace function public\.reserve_analysis_usage_event/i,
    );
    expect(sql).toMatch(
      /revoke all on function public\.reserve_analysis_usage_event[\s\S]*from public, anon, authenticated;/i,
    );
    expect(sql).toMatch(
      /grant execute on function public\.reserve_analysis_usage_event[\s\S]*to service_role;/i,
    );
  });

  it("limits support tickets to the creator and internal admins", () => {
    expect(sql).toMatch(
      /create policy "ticket creators and admins can read support tickets"/i,
    );
    expect(sql).toMatch(/support_tickets[\s\S]*private\.is_internal_admin/i);
  });

  it("defines private project storage buckets and user/project-prefixed paths", () => {
    expect(sql).toMatch(/insert into storage\.buckets/i);
    expect(sql).toMatch(/'project-assets'/i);
    expect(sql).toMatch(/public\s*=\s*false/i);
    expect(sql).toMatch(/create policy "workspace members can read project assets"/i);
    expect(sql).toMatch(
      /\(?storage\.foldername\(name\)\)?\[1\]\s*=\s*\(select auth\.uid\(\)\)::text/i,
    );
    expect(sql).toMatch(
      /\(?storage\.foldername\(name\)\)?\[2\]\s*=\s*project_id::text/i,
    );
  });

  it("hardens security-definer functions with explicit pg_catalog search path", () => {
    expect(sql).toMatch(/security definer\s+set search_path = public, pg_catalog/i);
    expect(sql).not.toMatch(/security definer\s+set search_path = public\s+as \$\$/i);
  });
});
