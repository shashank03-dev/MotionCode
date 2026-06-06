import type { PlanTier } from "@/lib/contracts/plans";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type Timestamp = string;

export type Database = {
  public: {
    Tables: {
      profiles: TableDefinition<
        {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          plan_tier: PlanTier;
          stripe_customer_id: string | null;
          is_internal_admin: boolean;
          onboarding_completed_at: Timestamp | null;
          deleted_at: Timestamp | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          plan_tier?: PlanTier;
          stripe_customer_id?: string | null;
          is_internal_admin?: boolean;
          onboarding_completed_at?: Timestamp | null;
          deleted_at?: Timestamp | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        Partial<{
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          plan_tier: PlanTier;
          stripe_customer_id: string | null;
          is_internal_admin: boolean;
          onboarding_completed_at: Timestamp | null;
          deleted_at: Timestamp | null;
          updated_at: Timestamp;
        }>
      >;
      workspaces: TableDefinition<
        {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          plan_tier: PlanTier;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          plan_tier?: PlanTier;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        Partial<{
          owner_id: string;
          name: string;
          slug: string;
          plan_tier: PlanTier;
          updated_at: Timestamp;
        }>
      >;
      workspace_members: TableDefinition<
        {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: Timestamp;
        },
        {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at?: Timestamp;
        },
        Partial<{
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
        }>
      >;
      projects: TableDefinition<
        {
          id: string;
          workspace_id: string;
          owner_id: string;
          title: string;
          description: string | null;
          source_type: "upload" | "url" | "prompt";
          status: "draft" | "uploaded" | "analyzing" | "generated" | "archived";
          latest_version_id: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: string;
          workspace_id: string;
          owner_id: string;
          title: string;
          description?: string | null;
          source_type: "upload" | "url" | "prompt";
          status?: "draft" | "uploaded" | "analyzing" | "generated" | "archived";
          latest_version_id?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        Partial<{
          workspace_id: string;
          owner_id: string;
          title: string;
          description: string | null;
          source_type: "upload" | "url" | "prompt";
          status: "draft" | "uploaded" | "analyzing" | "generated" | "archived";
          latest_version_id: string | null;
          updated_at: Timestamp;
        }>
      >;
      project_versions: TableDefinition<
        {
          id: string;
          project_id: string;
          created_by: string;
          version_number: number;
          label: string | null;
          motion_spec: Json;
          created_at: Timestamp;
        },
        {
          id?: string;
          project_id: string;
          created_by: string;
          version_number: number;
          label?: string | null;
          motion_spec: Json;
          created_at?: Timestamp;
        },
        Partial<{
          label: string | null;
          motion_spec: Json;
        }>
      >;
      assets: TableDefinition<
        {
          id: string;
          project_id: string;
          owner_id: string;
          storage_path: string;
          filename: string;
          mime_type: string;
          byte_size: number;
          duration_ms: number | null;
          frame_count: number;
          created_at: Timestamp;
        },
        {
          id?: string;
          project_id: string;
          owner_id: string;
          storage_path: string;
          filename: string;
          mime_type: string;
          byte_size: number;
          duration_ms?: number | null;
          frame_count?: number;
          created_at?: Timestamp;
        },
        Partial<{
          storage_path: string;
          filename: string;
          mime_type: string;
          byte_size: number;
          duration_ms: number | null;
          frame_count: number;
        }>
      >;
      analyses: TableDefinition<
        {
          id: string;
          project_id: string;
          version_id: string | null;
          owner_id: string;
          model: string;
          prompt_version: string;
          status: "queued" | "running" | "succeeded" | "failed";
          frame_count: number;
          raw_result: Json | null;
          normalized_spec: Json;
          created_at: Timestamp;
        },
        {
          id?: string;
          project_id: string;
          version_id?: string | null;
          owner_id: string;
          model: string;
          prompt_version: string;
          status: "queued" | "running" | "succeeded" | "failed";
          frame_count: number;
          raw_result?: Json | null;
          normalized_spec: Json;
          created_at?: Timestamp;
        },
        Partial<{
          version_id: string | null;
          status: "queued" | "running" | "succeeded" | "failed";
          raw_result: Json | null;
          normalized_spec: Json;
        }>
      >;
      generated_outputs: TableDefinition<
        {
          id: string;
          analysis_id: string;
          project_id: string;
          framework: string;
          code: string;
          dependencies: Json;
          setup_notes: Json;
          warnings: Json;
          created_at: Timestamp;
        },
        {
          id?: string;
          analysis_id: string;
          project_id: string;
          framework: string;
          code: string;
          dependencies?: Json;
          setup_notes?: Json;
          warnings?: Json;
          created_at?: Timestamp;
        },
        Partial<{
          framework: string;
          code: string;
          dependencies: Json;
          setup_notes: Json;
          warnings: Json;
        }>
      >;
      usage_events: TableDefinition<
        {
          id: string;
          user_id: string;
          event_type: string;
          plan_tier: PlanTier;
          model: string | null;
          frame_count: number | null;
          workspace_id: string | null;
          project_id: string | null;
          created_at: Timestamp;
        },
        {
          id?: string;
          user_id: string;
          event_type: string;
          plan_tier: PlanTier;
          model?: string | null;
          frame_count?: number | null;
          workspace_id?: string | null;
          project_id?: string | null;
          created_at?: Timestamp;
        },
        Partial<{
          event_type: string;
          plan_tier: PlanTier;
          model: string | null;
          frame_count: number | null;
          workspace_id: string | null;
          project_id: string | null;
        }>
      >;
      subscriptions: TableDefinition<
        {
          id: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          status: string;
          plan_tier: PlanTier;
          current_period_end: Timestamp | null;
          cancel_at_period_end: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: string;
          user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          status: string;
          plan_tier: PlanTier;
          current_period_end?: Timestamp | null;
          cancel_at_period_end?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        Partial<{
          status: string;
          plan_tier: PlanTier;
          current_period_end: Timestamp | null;
          cancel_at_period_end: boolean;
          updated_at: Timestamp;
        }>
      >;
      share_links: TableDefinition<
        {
          id: string;
          project_id: string;
          owner_id: string;
          token_hash: string;
          access_mode: "read" | "comment";
          include_comments: boolean;
          expires_at: Timestamp | null;
          revoked_at: Timestamp | null;
          created_at: Timestamp;
        },
        {
          id?: string;
          project_id: string;
          owner_id: string;
          token_hash: string;
          access_mode?: "read" | "comment";
          include_comments?: boolean;
          expires_at?: Timestamp | null;
          revoked_at?: Timestamp | null;
          created_at?: Timestamp;
        },
        Partial<{
          access_mode: "read" | "comment";
          include_comments: boolean;
          expires_at: Timestamp | null;
          revoked_at: Timestamp | null;
        }>
      >;
      project_comments: TableDefinition<
        {
          id: string;
          project_id: string;
          author_id: string;
          body: string;
          resolved_at: Timestamp | null;
          created_at: Timestamp;
        },
        {
          id?: string;
          project_id: string;
          author_id: string;
          body: string;
          resolved_at?: Timestamp | null;
          created_at?: Timestamp;
        },
        Partial<{
          body: string;
          resolved_at: Timestamp | null;
        }>
      >;
      support_tickets: TableDefinition<
        {
          id: string;
          user_id: string;
          assigned_admin_id: string | null;
          subject: string;
          body: string;
          status: "open" | "pending" | "closed";
          priority: "standard" | "priority" | "urgent";
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: string;
          user_id: string;
          assigned_admin_id?: string | null;
          subject: string;
          body: string;
          status?: "open" | "pending" | "closed";
          priority?: "standard" | "priority" | "urgent";
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        Partial<{
          assigned_admin_id: string | null;
          subject: string;
          body: string;
          status: "open" | "pending" | "closed";
          priority: "standard" | "priority" | "urgent";
          updated_at: Timestamp;
        }>
      >;
      audit_events: TableDefinition<
        {
          id: string;
          actor_id: string | null;
          workspace_id: string | null;
          event_type: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Json;
          created_at: Timestamp;
        },
        {
          id?: string;
          actor_id?: string | null;
          workspace_id?: string | null;
          event_type: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json;
          created_at?: Timestamp;
        },
        never
      >;
      admin_plan_overrides: TableDefinition<
        {
          id: string;
          user_id: string;
          created_by: string;
          plan_tier: PlanTier;
          reason: string;
          expires_at: Timestamp | null;
          created_at: Timestamp;
        },
        {
          id?: string;
          user_id: string;
          created_by: string;
          plan_tier: PlanTier;
          reason: string;
          expires_at?: Timestamp | null;
          created_at?: Timestamp;
        },
        Partial<{
          plan_tier: PlanTier;
          reason: string;
          expires_at: Timestamp | null;
        }>
      >;
      team_members: TableDefinition<
        {
          id: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: Timestamp;
        },
        {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at?: Timestamp;
        },
        Partial<{
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
        }>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
