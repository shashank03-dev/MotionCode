create or replace function private.user_saved_project_limit(_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select case
    when exists (
      select 1
      from public.subscriptions
      where user_id = _user_id
        and payment_provider = 'razorpay'
        and plan_tier = 'studio'
        and coalesce(razorpay_subscription_id, '') <> ''
        and status in ('active', 'past_due', 'trialing')
    ) then 2000
    when exists (
      select 1
      from public.subscriptions
      where user_id = _user_id
        and payment_provider = 'razorpay'
        and plan_tier = 'pro'
        and coalesce(razorpay_subscription_id, '') <> ''
        and status in ('active', 'past_due', 'trialing')
    ) then 250
    else 3
  end;
$$;

create or replace function private.active_saved_project_count(_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select count(*)::integer
  from public.projects
  where owner_id = _user_id
    and status in ('draft', 'uploaded', 'analyzing', 'generated');
$$;

create or replace function private.can_create_project(
  _workspace_id uuid,
  _owner_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    private.is_workspace_member(_workspace_id, _owner_id)
    and private.active_saved_project_count(_owner_id) < private.user_saved_project_limit(_owner_id),
    false
  );
$$;

alter policy "workspace members can create projects"
  on public.projects
  with check (
    owner_id = (select auth.uid())
    and private.can_create_project(workspace_id, (select auth.uid()))
  );
