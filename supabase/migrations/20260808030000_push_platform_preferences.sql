alter table public.push_subscriptions add column if not exists platforms text[] not null default array['steam','epic-games'];
drop policy if exists "devices can subscribe" on public.push_subscriptions;
create policy "server can insert subscriptions" on public.push_subscriptions for insert to anon, authenticated with check ((select private.has_sync_secret()));
