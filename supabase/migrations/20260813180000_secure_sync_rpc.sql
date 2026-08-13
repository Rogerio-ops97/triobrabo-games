create or replace function private.valid_sync_token(sync_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    encode(extensions.digest(coalesce(sync_token, ''), 'sha256'), 'hex') =
      (select decrypted_secret from vault.decrypted_secrets where name = 'sync_secret_hash' limit 1)
    or coalesce(sync_token, '') =
      coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'sync_cron_token' limit 1), '');
$$;

revoke all on function private.valid_sync_token(text) from public;
grant execute on function private.valid_sync_token(text) to anon, authenticated;

create or replace function public.sync_free_games(payload jsonb, sync_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if not private.valid_sync_token(sync_token) then raise exception 'unauthorized'; end if;
  with input as (
    select * from jsonb_to_recordset(payload) as x(
      source_id text, slug text, title text, store text, description text, image_url text,
      claim_url text, original_price numeric, starts_at timestamptz, ends_at timestamptz,
      genres text[], featured boolean, is_active boolean
    )
  ), upserted as (
    insert into public.games(source_id,slug,title,store,description,image_url,claim_url,original_price,starts_at,ends_at,genres,featured,is_active)
    select source_id,slug,title,store,description,image_url,claim_url,original_price,starts_at,ends_at,genres,featured,is_active from input
    on conflict (source_id) do update set
      slug=excluded.slug,title=excluded.title,store=excluded.store,description=excluded.description,
      image_url=excluded.image_url,claim_url=excluded.claim_url,original_price=excluded.original_price,
      starts_at=excluded.starts_at,ends_at=excluded.ends_at,genres=excluded.genres,
      featured=excluded.featured,is_active=excluded.is_active,updated_at=now()
    returning public.games.*, (xmax = 0) as is_new
  )
  select coalesce(jsonb_agg(to_jsonb(upserted)), '[]'::jsonb) into result from upserted;
  return result;
end;
$$;

create or replace function public.push_targets(platform_slug text, sync_token text)
returns table(id uuid, endpoint text, p256dh text, auth text)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.valid_sync_token(sync_token) then raise exception 'unauthorized'; end if;
  return query select p.id,p.endpoint,p.p256dh,p.auth from public.push_subscriptions p
    where p.active and p.platforms @> array[platform_slug] and p.alert_types @> array['free-games'];
end;
$$;

create or replace function public.disable_push_target(subscription_id uuid, sync_token text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.valid_sync_token(sync_token) then raise exception 'unauthorized'; end if;
  update public.push_subscriptions set active=false,updated_at=now() where id=subscription_id;
end;
$$;

create or replace function public.mark_game_notified(game_id uuid, sync_token text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not private.valid_sync_token(sync_token) then raise exception 'unauthorized'; end if;
  update public.games set notified_at=now() where id=game_id and notified_at is null;
end;
$$;

revoke all on function public.sync_free_games(jsonb,text), public.push_targets(text,text), public.disable_push_target(uuid,text), public.mark_game_notified(uuid,text) from public;
grant execute on function public.sync_free_games(jsonb,text), public.push_targets(text,text), public.disable_push_target(uuid,text), public.mark_game_notified(uuid,text) to anon, authenticated;
