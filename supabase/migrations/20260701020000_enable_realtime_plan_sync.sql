-- Live plan sync: broadcast changes to a user's profile (admin plan override)
-- and subscription (Razorpay lifecycle) so the open app refreshes the rendered
-- plan tier without a manual reload. Realtime still enforces RLS, so a client
-- only receives changes to rows it is already allowed to read.
--
-- Idempotent: safe to run whether or not the tables are already published.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'subscriptions'
  ) then
    alter publication supabase_realtime add table public.subscriptions;
  end if;
end
$$;

-- FULL replica identity so UPDATE/DELETE events carry the whole row, which lets
-- Realtime evaluate RLS and the client-side `id` / `user_id` filters reliably.
alter table public.profiles replica identity full;
alter table public.subscriptions replica identity full;
