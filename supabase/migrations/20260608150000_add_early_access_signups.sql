create table if not exists public.early_access_signups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  desired_plan text not null check (desired_plan in ('pro', 'studio')),
  status text not null default 'requested' check (status in ('requested', 'invited', 'converted', 'closed')),
  source text not null default 'pricing',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, desired_plan)
);

alter table public.early_access_signups enable row level security;

grant select on public.early_access_signups to authenticated;
grant insert (user_id, email, desired_plan, source, notes) on public.early_access_signups to authenticated;
grant update (email, source, notes, updated_at) on public.early_access_signups to authenticated;

create policy "Users can read own early access signups"
  on public.early_access_signups
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can request own early access"
  on public.early_access_signups
  for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'requested');

create policy "Users can refresh own early access request"
  on public.early_access_signups
  for update
  to authenticated
  using (auth.uid() = user_id and status = 'requested')
  with check (auth.uid() = user_id and status = 'requested');

create trigger early_access_signups_set_updated_at
  before update on public.early_access_signups
  for each row execute function private.set_updated_at();

create index if not exists early_access_signups_user_id_idx
  on public.early_access_signups(user_id);

create index if not exists early_access_signups_status_created_at_idx
  on public.early_access_signups(status, created_at desc);
