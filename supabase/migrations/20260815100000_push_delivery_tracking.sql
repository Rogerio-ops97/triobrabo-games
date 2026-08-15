create table if not exists public.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  status text not null check (status in ('accepted','failed')),
  attempts integer not null default 1,
  last_error text,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(game_id,subscription_id)
);
alter table public.push_deliveries enable row level security;
revoke all on table public.push_deliveries from anon,authenticated;
create index if not exists push_deliveries_subscription_idx on public.push_deliveries(subscription_id);

create or replace function public.push_targets_for_game(platform_slug text,target_game_id uuid,sync_token text)
returns table(id uuid,endpoint text,p256dh text,auth text)
language plpgsql security definer set search_path='' as $$
begin
  if not private.valid_sync_token(sync_token) then raise exception 'unauthorized'; end if;
  return query select p.id,p.endpoint,p.p256dh,p.auth from public.push_subscriptions p
  where p.active and p.platforms @> array[platform_slug] and p.alert_types @> array['free-games']
  and not exists (select 1 from public.push_deliveries d where d.game_id=target_game_id and d.subscription_id=p.id and d.status='accepted');
end;
$$;

create or replace function public.record_push_delivery(target_game_id uuid,target_subscription_id uuid,delivery_status text,error_message text,sync_token text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not private.valid_sync_token(sync_token) then raise exception 'unauthorized'; end if;
  if delivery_status not in ('accepted','failed') then raise exception 'invalid delivery status'; end if;
  insert into public.push_deliveries(game_id,subscription_id,status,last_error,accepted_at)
  values(target_game_id,target_subscription_id,delivery_status,error_message,case when delivery_status='accepted' then now() end)
  on conflict(game_id,subscription_id) do update set status=excluded.status,attempts=public.push_deliveries.attempts+1,last_error=excluded.last_error,accepted_at=case when excluded.status='accepted' then now() else public.push_deliveries.accepted_at end,updated_at=now();
end;
$$;

revoke all on function public.push_targets_for_game(text,uuid,text),public.record_push_delivery(uuid,uuid,text,text,text) from public;
grant execute on function public.push_targets_for_game(text,uuid,text),public.record_push_delivery(uuid,uuid,text,text,text) to anon,authenticated;
