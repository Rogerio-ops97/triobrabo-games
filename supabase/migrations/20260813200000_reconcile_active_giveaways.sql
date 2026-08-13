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
    (g.source_id like 'gamerpower:%' or g.source_id like 'epic:%')
    and not exists (select 1 from jsonb_array_elements(payload) item where item->>'source_id'=g.source_id)
  ));
  with input as (
    select * from jsonb_to_recordset(payload) as x(source_id text,slug text,title text,store text,description text,image_url text,claim_url text,original_price numeric,starts_at timestamptz,ends_at timestamptz,genres text[],featured boolean,is_active boolean)
  ), upserted as (
    insert into public.games(source_id,slug,title,store,description,image_url,claim_url,original_price,starts_at,ends_at,genres,featured,is_active)
    select source_id,slug,title,store,description,image_url,claim_url,original_price,starts_at,ends_at,genres,featured,is_active from input
    on conflict (source_id) do update set slug=excluded.slug,title=excluded.title,store=excluded.store,description=excluded.description,image_url=excluded.image_url,claim_url=excluded.claim_url,original_price=excluded.original_price,starts_at=excluded.starts_at,ends_at=excluded.ends_at,genres=excluded.genres,featured=excluded.featured,is_active=excluded.is_active,updated_at=now()
    returning public.games.*,(xmax=0) as is_new
  ) select coalesce(jsonb_agg(to_jsonb(upserted)),'[]'::jsonb) into result from upserted;
  return result;
end;
$$;
