create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
create or replace function private.has_sync_secret() returns boolean language sql stable security definer set search_path='' as $$select encode(extensions.digest(coalesce(current_setting('request.headers',true)::json->>'x-sync-secret',''),'sha256'),'hex')=(select decrypted_secret from vault.decrypted_secrets where name='sync_secret_hash' limit 1)$$;
revoke all on function private.has_sync_secret() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.has_sync_secret() to anon, authenticated;
alter table public.games add column if not exists notified_at timestamptz;
create unique index if not exists games_source_id_unique on public.games(source_id);

create table if not exists public.push_subscriptions (
 id uuid primary key default gen_random_uuid(), endpoint text not null unique,
 p256dh text not null, auth text not null, user_agent text not null default '',
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
revoke all on table public.push_subscriptions from anon, authenticated;
grant insert, select, update on table public.push_subscriptions to anon, authenticated;
create policy "devices can subscribe" on public.push_subscriptions for insert to anon, authenticated with check (endpoint like 'https://%' and length(endpoint)<2048 and length(p256dh)<256 and length(auth)<128);
create policy "server can read subscriptions" on public.push_subscriptions for select to anon, authenticated using ((select private.has_sync_secret()));
create policy "server can update subscriptions" on public.push_subscriptions for update to anon, authenticated using ((select private.has_sync_secret())) with check ((select private.has_sync_secret()));

grant insert, update on table public.games to anon, authenticated;
create policy "server can insert games" on public.games for insert to anon, authenticated with check ((select private.has_sync_secret()));
create policy "server can update games" on public.games for update to anon, authenticated using ((select private.has_sync_secret())) with check ((select private.has_sync_secret()));
