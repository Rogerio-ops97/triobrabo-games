-- The environment-specific sync_secret_hash is provisioned directly in Supabase Vault.
alter policy "server can read subscriptions" on public.push_subscriptions using ((select private.has_sync_secret()));
alter policy "server can update subscriptions" on public.push_subscriptions using ((select private.has_sync_secret())) with check ((select private.has_sync_secret()));
alter policy "server can insert games" on public.games with check ((select private.has_sync_secret()));
alter policy "server can update games" on public.games using ((select private.has_sync_secret())) with check ((select private.has_sync_secret()));
