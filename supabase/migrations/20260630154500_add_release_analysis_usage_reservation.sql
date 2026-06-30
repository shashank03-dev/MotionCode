create or replace function public.release_analysis_usage_event(
  p_user_id uuid,
  p_period_start timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  released_id uuid;
begin
  perform pg_advisory_xact_lock(
    hashtext(p_user_id::text),
    hashtext((p_period_start at time zone 'UTC')::date::text)
  );

  delete from public.usage_events
  where id = (
    select id
    from public.usage_events
    where user_id = p_user_id
      and event_type = 'analysis.started'
      and created_at >= p_period_start
      and created_at < p_period_start + interval '1 day'
    order by created_at desc
    limit 1
  )
  returning id into released_id;

  return released_id is not null;
end;
$$;

revoke all on function public.release_analysis_usage_event(
  uuid,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.release_analysis_usage_event(
  uuid,
  timestamptz
) to service_role;

comment on function public.release_analysis_usage_event(
  uuid,
  timestamptz
) is 'Rolls back a reserved analysis.started usage event (most recent within the user/day quota window) when the analysis fails, so failed analyses do not consume the daily quota.';
