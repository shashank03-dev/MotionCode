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
    expect(sql).not.toMatch(/\bdelete\s+from\b/i);
    expect(sql).not.toMatch(/\btruncate\b/i);
    expect(sql).not.toMatch(/\bdrop\s+/i);
    expect(sql).not.toMatch(/\balter\s+table\b[\s\S]*?\bdrop\b/i);
  });

  it("enforces plan tiers and role/status check constraints", () => {
    expect(sql).toMatch(
      /profiles[\s\S]*plan_tier[\s\S]*check[\s\S]*'free'[\s\S]*'pro'[\s\S]*'studio'/i,
    );
    expect(sql).toMatch(
      /workspace_members[\s\S]*role[\s\S]*check[\s\S]*'owner'[\s\S]*'admin'[\s\S]*'member'/i,
    );
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
});
