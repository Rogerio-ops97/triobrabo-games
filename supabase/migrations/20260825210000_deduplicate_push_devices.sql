alter table public.push_subscriptions
add column if not exists device_key text;

create unique index if not exists push_subscriptions_device_key_idx
on public.push_subscriptions(device_key)
where device_key is not null;

create or replace function public.register_push_subscription(
  subscription_endpoint text,
  subscription_p256dh text,
  subscription_auth text,
  subscription_platforms text[],
  subscription_alert_types text[],
  subscription_user_agent text,
  subscription_device_key text,
  sync_token text
)
returns uuid
language plpgsql security definer set search_path='' as $$
declare subscription_id uuid;
begin
  if not private.valid_sync_token(sync_token) then raise exception 'unauthorized'; end if;
  if subscription_device_key !~ '^[a-fA-F0-9-]{20,64}$' then raise exception 'invalid device key'; end if;

  update public.push_subscriptions
  set active=false,device_key=null,updated_at=now()
  where device_key=subscription_device_key and endpoint<>subscription_endpoint;

  insert into public.push_subscriptions(endpoint,p256dh,auth,platforms,alert_types,active,user_agent,device_key,updated_at)
  values(subscription_endpoint,subscription_p256dh,subscription_auth,subscription_platforms,subscription_alert_types,true,subscription_user_agent,subscription_device_key,now())
  on conflict(endpoint) do update set
    p256dh=excluded.p256dh,
    auth=excluded.auth,
    platforms=excluded.platforms,
    alert_types=excluded.alert_types,
    active=true,
    user_agent=excluded.user_agent,
    device_key=excluded.device_key,
    updated_at=now()
  returning id into subscription_id;

  return subscription_id;
end;
$$;

revoke all on function public.register_push_subscription(text,text,text,text[],text[],text,text,text) from public;
grant execute on function public.register_push_subscription(text,text,text,text[],text[],text,text,text) to anon,authenticated;
