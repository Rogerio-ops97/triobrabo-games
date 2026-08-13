create or replace function private.has_sync_secret()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    encode(extensions.digest(coalesce(current_setting('request.headers', true)::json->>'x-sync-secret', ''), 'sha256'), 'hex') =
      (select decrypted_secret from vault.decrypted_secrets where name = 'sync_secret_hash' limit 1)
    or
    encode(extensions.digest(coalesce(current_setting('request.headers', true)::json->>'x-sync-cron-token', ''), 'sha256'), 'hex') =
      encode(extensions.digest(coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'sync_cron_token' limit 1), ''), 'sha256'), 'hex');
$$;

revoke all on function private.has_sync_secret() from public;
grant execute on function private.has_sync_secret() to anon, authenticated;
