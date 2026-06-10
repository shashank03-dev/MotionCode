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
) from public, anon, authenticated;

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
