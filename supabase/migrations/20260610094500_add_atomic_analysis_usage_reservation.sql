create or replace function public.reserve_analysis_usage_event(
  p_user_id uuid,
  p_event_type text,
  p_plan_tier text,
  p_daily_limit integer,
  p_period_start timestamptz,
  p_model text default null,
  p_frame_count integer default null,
  p_workspace_id uuid default null,
  p_project_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  current_usage_count integer;
begin
  if p_event_type <> 'analysis.started' then
    raise exception 'reserve_analysis_usage_event only reserves analysis.started events'
      using errcode = '22023';
  end if;

  if p_daily_limit is null or p_daily_limit <= 0 then
    return false;
  end if;

  perform pg_advisory_xact_lock(
    hashtext(p_user_id::text),
    hashtext((p_period_start at time zone 'UTC')::date::text)
  );

  select greatest(
    count(*) filter (where event_type = 'analysis.started'),
    count(*) filter (where event_type = 'analysis.completed')
  )::integer
  into current_usage_count
  from public.usage_events
  where user_id = p_user_id
    and created_at >= p_period_start
    and created_at < p_period_start + interval '1 day'
    and event_type in ('analysis.started', 'analysis.completed');

  if current_usage_count >= p_daily_limit then
    return false;
  end if;

  insert into public.usage_events (
    user_id,
    event_type,
    plan_tier,
    model,
    frame_count,
    workspace_id,
    project_id
  )
  values (
    p_user_id,
    p_event_type,
    p_plan_tier,
    p_model,
    p_frame_count,
    p_workspace_id,
    p_project_id
  );

  return true;
end;
$$;

revoke all on function public.reserve_analysis_usage_event(
  uuid,
  text,
  text,
  integer,
  timestamptz,
  text,
  integer,
  uuid,
  uuid
) from public;

grant execute on function public.reserve_analysis_usage_event(
  uuid,
  text,
  text,
  integer,
  timestamptz,
  text,
  integer,
  uuid,
  uuid
) to service_role;

comment on function public.reserve_analysis_usage_event(
  uuid,
  text,
  text,
  integer,
  timestamptz,
  text,
  integer,
  uuid,
  uuid
) is 'Atomically reserves an analysis.started usage event within a user/day quota.';
