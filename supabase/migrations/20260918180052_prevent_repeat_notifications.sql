alter table public.games
  add column if not exists notification_key text;

update public.games
set notification_key = trim(both '-' from regexp_replace(
  translate(
    lower(regexp_replace(title, '\s*\([^)]*\)\s*(Key\s+)?Giveaway.*$', '', 'i')),
    'áàâãäéèêëíìîïóòôõöúùûüçñ',
    'aaaaaeeeeiiiiooooouuuucn'
  ),
  '[^a-z0-9]+', '-', 'g'
)) || ':' || trim(both '-' from regexp_replace(lower(store), '[^a-z0-9]+', '-', 'g'))
where notification_key is null;

create index if not exists games_notification_key_idx
  on public.games(notification_key);

create or replace function public.sync_free_games(payload jsonb, sync_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare result jsonb;
begin
  if not private.valid_sync_token(sync_token) then raise exception 'unauthorized'; end if;

  update public.games g set is_active=false,updated_at=now()
  where g.is_active and (g.source_id is null or g.ends_at<=now() or (
    (g.source_id like 'gamerpower:%' or g.source_id like 'epic:%' or g.source_id like 'itad:%')
    and not exists (select 1 from jsonb_array_elements(payload) item where item->>'source_id'=g.source_id)
  ));

  with input as (
    select * from jsonb_to_recordset(payload) as x(
      source_id text, notification_key text, slug text, title text, store text,
      description text, image_url text, claim_url text, original_price numeric,
      starts_at timestamptz, ends_at timestamptz, genres text[], featured boolean,
      is_active boolean
    )
  ), upserted as (
    insert into public.games(
      source_id,notification_key,slug,title,store,description,image_url,claim_url,
      original_price,starts_at,ends_at,genres,featured,is_active
    )
    select source_id,notification_key,slug,title,store,description,image_url,claim_url,
      original_price,starts_at,ends_at,genres,featured,is_active
    from input
    on conflict (source_id) do update set
      notification_key=coalesce(excluded.notification_key,public.games.notification_key),slug=excluded.slug,title=excluded.title,
      store=excluded.store,description=excluded.description,image_url=excluded.image_url,
      claim_url=excluded.claim_url,original_price=excluded.original_price,
      starts_at=excluded.starts_at,ends_at=excluded.ends_at,genres=excluded.genres,
      featured=excluded.featured,is_active=excluded.is_active,
      notified_at=case
        when not public.games.is_active or public.games.ends_at<=now() then null
        else public.games.notified_at
      end,
      updated_at=now()
    returning public.games.*,(xmax=0) as is_new
  )
  select coalesce(jsonb_agg(to_jsonb(upserted)),'[]'::jsonb)
  into result from upserted;

  return result;
end;
$$;

create or replace function public.push_targets_for_game(
  platform_slug text,
  target_game_id uuid,
  sync_token text
)
returns table(id uuid,endpoint text,p256dh text,auth text)
language plpgsql
security definer
set search_path = ''
as $$
declare target_key text;
begin
  if not private.valid_sync_token(sync_token) then raise exception 'unauthorized'; end if;

  select g.notification_key into target_key
  from public.games g
  where g.id=target_game_id;

  return query
  select p.id,p.endpoint,p.p256dh,p.auth
  from public.push_subscriptions p
  where p.active
    and p.platforms @> array[platform_slug]
    and p.alert_types @> array['free-games']
    and not exists (
      select 1
      from public.push_deliveries d
      join public.games previous_game on previous_game.id=d.game_id
      where d.subscription_id=p.id
        and d.status='accepted'
        and coalesce(d.accepted_at,d.updated_at) >= now()-interval '30 days'
        and (
          previous_game.id=target_game_id
          or (
            target_key is not null
            and previous_game.notification_key=target_key
          )
        )
    );
end;
$$;

revoke all on function public.sync_free_games(jsonb,text) from public;
grant execute on function public.sync_free_games(jsonb,text) to anon;
revoke all on function public.push_targets_for_game(text,uuid,text) from public;
grant execute on function public.push_targets_for_game(text,uuid,text) to anon;
