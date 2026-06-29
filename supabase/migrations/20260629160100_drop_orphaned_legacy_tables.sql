-- F3: Reconcile schema drift — remove orphaned legacy tables.
--
-- These tables exist in the production database but were created out-of-band
-- (never via a repo migration). At audit time each had:
--   * 0 references anywhere in the application source, and
--   * 0 rows, and
--   * no inbound foreign keys from real tables and no dependent views.
--
-- They are dead schema. Removing them keeps supabase/migrations as the single
-- source of truth for the production schema and removes unused attack surface.
--
-- Defensive guard (mirrors the legacy billing cleanup in
-- 20260610003000): refuse to run if any of these tables still hold rows, so an
-- environment that has started using them is never silently destroyed.
do $$
declare
  populated text;
begin
  select string_agg(name, ', ') into populated
  from (
    select 'analysis_frames' as name where exists (select 1 from public.analysis_frames)
    union all select 'animation_analyses' where exists (select 1 from public.animation_analyses)
    union all select 'generated_code_outputs' where exists (select 1 from public.generated_code_outputs)
    union all select 'export_events' where exists (select 1 from public.export_events)
    union all select 'feedback_messages' where exists (select 1 from public.feedback_messages)
    union all select 'user_usage_daily' where exists (select 1 from public.user_usage_daily)
    union all select 'billing_entitlements' where exists (select 1 from public.billing_entitlements)
  ) s;

  if populated is not null then
    raise exception
      'Refusing to remove orphaned legacy tables that still contain rows: %. Export or migrate that data first.',
      populated;
  end if;
end $$;

drop table if exists public.analysis_frames cascade;
drop table if exists public.animation_analyses cascade;
drop table if exists public.generated_code_outputs cascade;
drop table if exists public.export_events cascade;
drop table if exists public.feedback_messages cascade;
drop table if exists public.user_usage_daily cascade;
drop table if exists public.billing_entitlements cascade;
