create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id),
  email text not null,
  display_name text,
  avatar_url text,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro', 'studio')),
  stripe_customer_id text unique,
  is_internal_admin boolean not null default false,
  onboarding_completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null check (length(btrim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro', 'studio')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug)
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  owner_id uuid not null references public.profiles(id),
  title text not null check (length(btrim(title)) > 0),
  description text,
  source_type text not null check (source_type in ('upload', 'url', 'prompt')),
  status text not null default 'draft' check (status in ('draft', 'uploaded', 'analyzing', 'generated', 'archived')),
  latest_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  version_number integer not null check (version_number > 0),
  label text,
  motion_spec jsonb not null,
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

alter table public.projects
  add constraint projects_latest_version_id_fkey
  foreign key (latest_version_id)
  references public.project_versions(id)
  on delete set null;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id),
  storage_path text not null unique,
  filename text not null check (length(btrim(filename)) > 0),
  mime_type text not null check (length(btrim(mime_type)) > 0),
  byte_size bigint not null check (byte_size >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  frame_count integer not null default 0 check (frame_count >= 0),
  created_at timestamptz not null default now(),
  check ((string_to_array(storage_path, '/'))[1] = owner_id::text),
  check ((string_to_array(storage_path, '/'))[2] = project_id::text)
);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  version_id uuid references public.project_versions(id) on delete set null,
  owner_id uuid not null references public.profiles(id),
  model text not null,
  prompt_version text not null,
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed')),
  frame_count integer not null check (frame_count >= 0),
  raw_result jsonb,
  normalized_spec jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_outputs (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  framework text not null,
  code text not null,
  dependencies jsonb not null default '[]'::jsonb check (jsonb_typeof(dependencies) = 'array'),
  setup_notes jsonb not null default '[]'::jsonb check (jsonb_typeof(setup_notes) = 'array'),
  warnings jsonb not null default '[]'::jsonb check (jsonb_typeof(warnings) = 'array'),
  created_at timestamptz not null default now()
);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  event_type text not null check (length(btrim(event_type)) > 0),
  plan_tier text not null check (plan_tier in ('free', 'pro', 'studio')),
  model text,
  frame_count integer check (frame_count is null or frame_count >= 0),
  workspace_id uuid references public.workspaces(id),
  project_id uuid references public.projects(id),
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  stripe_customer_id text not null,
  stripe_subscription_id text not null,
  status text not null check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
  plan_tier text not null check (plan_tier in ('free', 'pro', 'studio')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (stripe_customer_id),
  unique (stripe_subscription_id)
);

create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id),
  token_hash text not null unique,
  access_mode text not null default 'read' check (access_mode in ('read', 'comment')),
  include_comments boolean not null default false,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (length(btrim(body)) > 0),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  assigned_admin_id uuid references public.profiles(id),
  subject text not null check (length(btrim(subject)) > 0),
  body text not null check (length(btrim(body)) > 0),
  status text not null default 'open' check (status in ('open', 'pending', 'closed')),
  priority text not null default 'standard' check (priority in ('standard', 'priority', 'urgent')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  workspace_id uuid references public.workspaces(id),
  event_type text not null check (length(btrim(event_type)) > 0),
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

comment on table public.audit_events is
  'Append-only audit log. Write with server-side helpers using trusted credentials; no direct authenticated client insert/update/delete policy is defined.';

create table if not exists public.admin_plan_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  created_by uuid not null references public.profiles(id),
  plan_tier text not null check (plan_tier in ('free', 'pro', 'studio')),
  reason text not null check (length(btrim(reason)) > 0),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists profiles_stripe_customer_id_idx on public.profiles (stripe_customer_id);
create index if not exists workspaces_owner_id_idx on public.workspaces (owner_id);
create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);
create index if not exists workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create index if not exists projects_workspace_id_idx on public.projects (workspace_id);
create index if not exists projects_owner_id_idx on public.projects (owner_id);
create index if not exists project_versions_project_id_idx on public.project_versions (project_id);
create index if not exists assets_project_id_idx on public.assets (project_id);
create index if not exists analyses_project_id_idx on public.analyses (project_id);
create index if not exists generated_outputs_project_id_idx on public.generated_outputs (project_id);
create index if not exists usage_events_user_created_at_idx on public.usage_events (user_id, created_at desc);
create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists share_links_project_id_idx on public.share_links (project_id);
create index if not exists project_comments_project_id_idx on public.project_comments (project_id);
create index if not exists support_tickets_user_id_idx on public.support_tickets (user_id);
create index if not exists audit_events_workspace_created_at_idx on public.audit_events (workspace_id, created_at desc);
create index if not exists admin_plan_overrides_user_id_idx on public.admin_plan_overrides (user_id);
create index if not exists team_members_workspace_id_idx on public.team_members (workspace_id);
create index if not exists team_members_user_id_idx on public.team_members (user_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function private.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function private.set_updated_at();

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function private.set_updated_at();

create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function private.set_updated_at();

create or replace function private.ensure_project_latest_version_matches()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if new.latest_version_id is not null and not exists (
    select 1
    from public.project_versions
    where id = new.latest_version_id
      and project_id = new.id
  ) then
    raise exception 'projects.latest_version_id must reference a version for the same project'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger projects_latest_version_matches
  before insert or update on public.projects
  for each row execute function private.ensure_project_latest_version_matches();

create or replace function private.ensure_analysis_version_matches()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if new.version_id is not null and not exists (
    select 1
    from public.project_versions
    where id = new.version_id
      and project_id = new.project_id
  ) then
    raise exception 'analyses.version_id must reference a version for the same project'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger analyses_version_matches
  before insert or update on public.analyses
  for each row execute function private.ensure_analysis_version_matches();

create or replace function private.ensure_generated_output_analysis_matches()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if not exists (
    select 1
    from public.analyses
    where id = new.analysis_id
      and project_id = new.project_id
  ) then
    raise exception 'generated_outputs.analysis_id must reference an analysis for the same project'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger generated_outputs_analysis_matches
  before insert or update on public.generated_outputs
  for each row execute function private.ensure_generated_output_analysis_matches();

create or replace function private.is_internal_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles
      where id = _user_id
        and is_internal_admin
        and deleted_at is null
    ),
    false
  );
$$;

create or replace function private.is_workspace_owner(_workspace_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    exists (
      select 1
      from public.workspaces
      where id = _workspace_id
        and owner_id = _user_id
    ),
    false
  );
$$;

create or replace function private.is_workspace_admin(_workspace_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    exists (
      select 1
      from public.workspace_members
      where workspace_id = _workspace_id
        and user_id = _user_id
        and role = 'admin'
    )
    or exists (
      select 1
      from public.team_members
      where workspace_id = _workspace_id
        and user_id = _user_id
        and role = 'admin'
    ),
    false
  );
$$;

create or replace function private.is_workspace_member(_workspace_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    private.is_workspace_owner(_workspace_id, _user_id)
    or exists (
      select 1
      from public.workspace_members
      where workspace_id = _workspace_id
        and user_id = _user_id
    )
    or exists (
      select 1
      from public.team_members
      where workspace_id = _workspace_id
        and user_id = _user_id
    ),
    false
  );
$$;

create or replace function private.can_manage_workspace_members(_workspace_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    private.is_workspace_owner(_workspace_id, _user_id)
    or private.is_workspace_admin(_workspace_id, _user_id),
    false
  );
$$;

create or replace function private.workspace_seat_limit(_workspace_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select case coalesce(
    (select plan_tier from public.workspaces where id = _workspace_id),
    'free'
  )
    when 'studio' then 5
    else 1
  end;
$$;

create or replace function private.workspace_member_count(_workspace_id uuid)
returns integer
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select count(*)::integer
  from (
    select user_id from public.workspace_members where workspace_id = _workspace_id
    union
    select owner_id as user_id from public.workspaces where id = _workspace_id
    union
    select user_id from public.team_members where workspace_id = _workspace_id
  ) members;
$$;

create or replace function private.can_read_project(_project_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    exists (
      select 1
      from public.projects
      join public.workspaces on workspaces.id = projects.workspace_id
      where projects.id = _project_id
        and (
          projects.owner_id = _user_id
          or (
            workspaces.plan_tier = 'studio'
            and private.is_workspace_member(projects.workspace_id, _user_id)
          )
        )
    ),
    false
  );
$$;

create or replace function private.can_write_project(_project_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce(
    exists (
      select 1
      from public.projects
      join public.workspaces on workspaces.id = projects.workspace_id
      where projects.id = _project_id
        and (
          projects.owner_id = _user_id
          or (
            workspaces.plan_tier = 'studio'
            and private.can_manage_workspace_members(projects.workspace_id, _user_id)
          )
        )
    ),
    false
  );
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
grant execute on all functions in schema private to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'project-assets',
  'project-assets',
  false,
  262144000,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'application/json'
  ]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.project_versions enable row level security;
alter table public.assets enable row level security;
alter table public.analyses enable row level security;
alter table public.generated_outputs enable row level security;
alter table public.usage_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.share_links enable row level security;
alter table public.project_comments enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_events enable row level security;
alter table public.admin_plan_overrides enable row level security;
alter table public.team_members enable row level security;
alter table storage.objects enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to authenticated;
grant select on
  public.profiles,
  public.workspaces,
  public.workspace_members,
  public.projects,
  public.project_versions,
  public.assets,
  public.analyses,
  public.generated_outputs,
  public.usage_events,
  public.subscriptions,
  public.share_links,
  public.project_comments,
  public.support_tickets,
  public.audit_events,
  public.admin_plan_overrides,
  public.team_members
to authenticated;
grant insert on
  public.profiles,
  public.workspaces,
  public.workspace_members,
  public.projects,
  public.project_versions,
  public.assets,
  public.project_comments,
  public.admin_plan_overrides,
  public.team_members
to authenticated;
grant insert (user_id, subject, body) on public.support_tickets to authenticated;
grant update (display_name, avatar_url, onboarding_completed_at, updated_at) on public.profiles to authenticated;
grant update (name, slug, updated_at) on public.workspaces to authenticated;
grant update (role) on public.workspace_members to authenticated;
grant update (title, description, status, latest_version_id, updated_at) on public.projects to authenticated;
grant update (label, motion_spec) on public.project_versions to authenticated;
grant update (storage_path, filename, mime_type, byte_size, duration_ms, frame_count) on public.assets to authenticated;
grant update (body, resolved_at) on public.project_comments to authenticated;
grant update (plan_tier, reason, expires_at) on public.admin_plan_overrides to authenticated;
grant update (role) on public.team_members to authenticated;
grant delete on public.workspace_members, public.team_members to authenticated;

create policy "authenticated users can read their profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or private.is_internal_admin((select auth.uid())));

create policy "authenticated users can create their profile"
  on public.profiles for insert
  to authenticated
  with check (
    id = (select auth.uid())
    and plan_tier = 'free'
    and is_internal_admin = false
    and stripe_customer_id is null
    and deleted_at is null
  );

create policy "authenticated users can update their profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or private.is_internal_admin((select auth.uid())))
  with check (id = (select auth.uid()) or private.is_internal_admin((select auth.uid())));

create policy "authenticated users can read workspaces"
  on public.workspaces for select
  to authenticated
  using (
    private.is_workspace_member(id, (select auth.uid()))
  );

create policy "authenticated users can create workspaces"
  on public.workspaces for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and plan_tier = 'free'
  );

create policy "workspace owners can update workspaces"
  on public.workspaces for update
  to authenticated
  using (
    private.is_workspace_owner(id, (select auth.uid()))
  )
  with check (
    private.is_workspace_owner(id, (select auth.uid()))
  );

create policy "workspace members can read membership"
  on public.workspace_members for select
  to authenticated
  using (
    private.is_workspace_member(workspace_id, (select auth.uid()))
  );

create policy "workspace owners and admins can invite members"
  on public.workspace_members for insert
  to authenticated
  with check (
    (
      private.is_workspace_owner(workspace_id, (select auth.uid()))
      or (
        private.is_workspace_admin(workspace_id, (select auth.uid()))
        and role = 'member'
      )
    )
    and private.workspace_member_count(workspace_id) < private.workspace_seat_limit(workspace_id)
  );

create policy "workspace owners can update members"
  on public.workspace_members for update
  to authenticated
  using (
    private.is_workspace_owner(workspace_id, (select auth.uid()))
  )
  with check (
    private.is_workspace_owner(workspace_id, (select auth.uid()))
  );

create policy "workspace owners and admins can remove members"
  on public.workspace_members for delete
  to authenticated
  using (
    private.is_workspace_owner(workspace_id, (select auth.uid()))
    or (
      private.is_workspace_admin(workspace_id, (select auth.uid()))
      and role = 'member'
    )
  );

create policy "authenticated users can read projects"
  on public.projects for select
  to authenticated
  using (
    private.can_read_project(id, (select auth.uid()))
  );

create policy "workspace members can create projects"
  on public.projects for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and private.is_workspace_member(workspace_id, (select auth.uid()))
  );

create policy "project owners and studio admins can update projects"
  on public.projects for update
  to authenticated
  using (
    private.can_write_project(id, (select auth.uid()))
  )
  with check (
    private.can_write_project(id, (select auth.uid()))
  );

create policy "project readers can read versions"
  on public.project_versions for select
  to authenticated
  using (
    private.can_read_project(project_id, (select auth.uid()))
  );

create policy "project writers can create versions"
  on public.project_versions for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      private.can_write_project(project_id, (select auth.uid()))
    )
  );

create policy "project writers can update versions"
  on public.project_versions for update
  to authenticated
  using (
    private.can_write_project(project_id, (select auth.uid()))
  )
  with check (
    private.can_write_project(project_id, (select auth.uid()))
  );

create policy "project readers can read assets"
  on public.assets for select
  to authenticated
  using (
    private.can_read_project(project_id, (select auth.uid()))
  );

create policy "project writers can create assets"
  on public.assets for insert
  to authenticated
  with check (
    owner_id = (select auth.uid())
    and (string_to_array(storage_path, '/'))[1] = (select auth.uid())::text
    and (string_to_array(storage_path, '/'))[2] = project_id::text
    and (
      private.can_write_project(project_id, (select auth.uid()))
    )
  );

create policy "project writers can update assets"
  on public.assets for update
  to authenticated
  using (
    private.can_write_project(project_id, (select auth.uid()))
  )
  with check (
    (string_to_array(storage_path, '/'))[1] = owner_id::text
    and (string_to_array(storage_path, '/'))[2] = project_id::text
    and (
      private.can_write_project(project_id, (select auth.uid()))
    )
  );

create policy "project readers can read analyses"
  on public.analyses for select
  to authenticated
  using (
    private.can_read_project(project_id, (select auth.uid()))
  );

create policy "project readers can read generated outputs"
  on public.generated_outputs for select
  to authenticated
  using (
    private.can_read_project(project_id, (select auth.uid()))
  );

create policy "users can read their usage events"
  on public.usage_events for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_internal_admin((select auth.uid())));

create policy "users and admins can read subscriptions"
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_internal_admin((select auth.uid())));

create policy "internal admins can create subscriptions"
  on public.subscriptions for insert
  to authenticated
  with check (private.is_internal_admin((select auth.uid())));

create policy "internal admins can update subscriptions"
  on public.subscriptions for update
  to authenticated
  using (private.is_internal_admin((select auth.uid())))
  with check (private.is_internal_admin((select auth.uid())));

create policy "authenticated users can read their share links"
  on public.share_links for select
  to authenticated
  using (
    owner_id = (select auth.uid())
    or private.can_write_project(project_id, (select auth.uid()))
  );

create policy "project readers can read comments"
  on public.project_comments for select
  to authenticated
  using (
    private.can_read_project(project_id, (select auth.uid()))
  );

create policy "project readers can create comments"
  on public.project_comments for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and (
      private.can_read_project(project_id, (select auth.uid()))
    )
  );

create policy "comment authors and project writers can update comments"
  on public.project_comments for update
  to authenticated
  using (
    author_id = (select auth.uid())
    or private.can_write_project(project_id, (select auth.uid()))
  )
  with check (
    author_id = (select auth.uid())
    or private.can_write_project(project_id, (select auth.uid()))
  );

create policy "ticket creators and admins can read support tickets"
  on public.support_tickets for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_internal_admin((select auth.uid())));

create policy "ticket creators can create support tickets"
  on public.support_tickets for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "workspace admins can read audit events"
  on public.audit_events for select
  to authenticated
  using (
    actor_id = (select auth.uid())
    or (
      workspace_id is not null
      and private.can_manage_workspace_members(workspace_id, (select auth.uid()))
    )
    or private.is_internal_admin((select auth.uid()))
  );

create policy "internal admins can read plan overrides"
  on public.admin_plan_overrides for select
  to authenticated
  using (private.is_internal_admin((select auth.uid())));

create policy "internal admins can create plan overrides"
  on public.admin_plan_overrides for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and private.is_internal_admin((select auth.uid()))
  );

create policy "internal admins can update plan overrides"
  on public.admin_plan_overrides for update
  to authenticated
  using (private.is_internal_admin((select auth.uid())))
  with check (private.is_internal_admin((select auth.uid())));

create policy "workspace members can read team membership"
  on public.team_members for select
  to authenticated
  using (
    private.is_workspace_member(workspace_id, (select auth.uid()))
  );

create policy "workspace owners and admins can invite team members"
  on public.team_members for insert
  to authenticated
  with check (
    (
      private.is_workspace_owner(workspace_id, (select auth.uid()))
      or (
        private.is_workspace_admin(workspace_id, (select auth.uid()))
        and role = 'member'
      )
    )
    and private.workspace_member_count(workspace_id) < private.workspace_seat_limit(workspace_id)
  );

create policy "workspace owners can update team members"
  on public.team_members for update
  to authenticated
  using (
    private.is_workspace_owner(workspace_id, (select auth.uid()))
  )
  with check (
    private.is_workspace_owner(workspace_id, (select auth.uid()))
  );

create policy "workspace owners and admins can remove team members"
  on public.team_members for delete
  to authenticated
  using (
    private.is_workspace_owner(workspace_id, (select auth.uid()))
    or (
      private.is_workspace_admin(workspace_id, (select auth.uid()))
      and role = 'member'
    )
  );

create policy "workspace members can read project assets"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-assets'
    and exists (
      select 1
      from public.assets
      where assets.storage_path = storage.objects.name
        and private.can_read_project(assets.project_id, (select auth.uid()))
    )
  );

create policy "workspace members can upload project assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from (
        select id as project_id
        from public.projects
      ) project_scope
      where (storage.foldername(name))[2] = project_id::text
        and private.can_write_project(project_id, (select auth.uid()))
    )
  );

create policy "workspace members can update project assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-assets'
    and exists (
      select 1
      from public.assets
      where assets.storage_path = storage.objects.name
        and private.can_write_project(assets.project_id, (select auth.uid()))
    )
  )
  with check (
    bucket_id = 'project-assets'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from (
        select id as project_id
        from public.projects
      ) project_scope
      where (storage.foldername(name))[2] = project_id::text
        and private.can_write_project(project_id, (select auth.uid()))
    )
  );
