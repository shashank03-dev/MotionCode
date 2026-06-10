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
          razorpay_customer_id: string | null;
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
          razorpay_customer_id?: string | null;
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
          razorpay_customer_id: string | null;
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
          role: "admin" | "member";
          created_at: Timestamp;
        },
        {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: "admin" | "member";
          created_at?: Timestamp;
        },
        Partial<{
          workspace_id: string;
          user_id: string;
          role: "admin" | "member";
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
        never,
        never
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
        never,
        never
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
        never,
        never
      >;
      subscriptions: TableDefinition<
        {
          id: string;
          user_id: string;
          payment_provider: "razorpay";
          razorpay_customer_id: string | null;
          razorpay_subscription_id: string | null;
          razorpay_payment_id: string | null;
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
          payment_provider?: "razorpay";
          razorpay_customer_id?: string | null;
          razorpay_subscription_id?: string | null;
          razorpay_payment_id?: string | null;
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
          payment_provider: "razorpay";
          razorpay_customer_id: string | null;
          razorpay_subscription_id: string | null;
          razorpay_payment_id: string | null;
          current_period_end: Timestamp | null;
          cancel_at_period_end: boolean;
          updated_at: Timestamp;
        }>
      >;
      billing_webhook_events: TableDefinition<
        {
          id: string;
          provider: "razorpay";
          event_id: string;
          event_type: string | null;
          processed_at: Timestamp;
          created_at: Timestamp;
        },
        {
          id?: string;
          provider?: "razorpay";
          event_id: string;
          event_type?: string | null;
          processed_at?: Timestamp;
          created_at?: Timestamp;
        },
        Partial<{
          provider: "razorpay";
          event_id: string;
          event_type: string | null;
          processed_at: Timestamp;
        }>
      >;
      early_access_signups: TableDefinition<
        {
          id: string;
          user_id: string;
          email: string | null;
          desired_plan: "pro" | "studio";
          status: "requested" | "invited" | "converted" | "closed";
          source: string;
          notes: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        },
        {
          id?: string;
          user_id: string;
          email?: string | null;
          desired_plan: "pro" | "studio";
          status?: "requested" | "invited" | "converted" | "closed";
          source?: string;
          notes?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        },
        Partial<{
          email: string | null;
          status: "requested" | "invited" | "converted" | "closed";
          source: string;
          notes: string | null;
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
        never,
        never
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
          user_id: string;
          subject: string;
          body: string;
        },
        never
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
          role: "admin" | "member";
          created_at: Timestamp;
        },
        {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: "admin" | "member";
          created_at?: Timestamp;
        },
        Partial<{
          workspace_id: string;
          user_id: string;
          role: "admin" | "member";
        }>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      reserve_analysis_usage_event: {
        Args: {
          p_daily_limit: number;
          p_event_type: string;
          p_frame_count?: number | null;
          p_model?: string | null;
          p_period_start: Timestamp;
          p_plan_tier: string;
          p_project_id?: string | null;
          p_user_id: string;
          p_workspace_id?: string | null;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
