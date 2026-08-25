create table if not exists private.api_rate_limits (
  bucket text not null,
  client_hash text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key(bucket,client_hash,window_start)
);

revoke all on table private.api_rate_limits from public,anon,authenticated;
create index if not exists api_rate_limits_window_idx on private.api_rate_limits(window_start);

create or replace function public.consume_api_rate_limit(
  rate_bucket text,
  rate_client_hash text,
  rate_maximum integer,
  rate_window_seconds integer,
  sync_token text
)
returns boolean
language plpgsql security definer set search_path='' as $$
declare
  current_window timestamptz;
  used integer;
begin
  if not private.valid_sync_token(sync_token) then raise exception 'unauthorized'; end if;
  if rate_bucket !~ '^[a-z0-9-]{1,64}$'
    or rate_client_hash !~ '^[a-f0-9]{64}$'
    or rate_maximum not between 1 and 10000
    or rate_window_seconds not between 10 and 86400 then
    raise exception 'invalid rate limit';
  end if;
  current_window := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / rate_window_seconds) * rate_window_seconds
  );
  insert into private.api_rate_limits(bucket,client_hash,window_start,request_count)
  values(rate_bucket,rate_client_hash,current_window,1)
  on conflict(bucket,client_hash,window_start)
  do update set request_count=private.api_rate_limits.request_count+1
  returning request_count into used;
  return used <= rate_maximum;
end;
$$;

revoke all on function public.consume_api_rate_limit(text,text,integer,integer,text) from public;
grant execute on function public.consume_api_rate_limit(text,text,integer,integer,text) to anon,authenticated;

revoke insert,update on table public.games from anon,authenticated;
revoke all on table public.push_subscriptions from anon,authenticated;
drop policy if exists "server can insert games" on public.games;
drop policy if exists "server can update games" on public.games;
drop policy if exists "server can insert subscriptions" on public.push_subscriptions;
drop policy if exists "server can read subscriptions" on public.push_subscriptions;
drop policy if exists "server can update subscriptions" on public.push_subscriptions;

drop function if exists public.push_targets(text,text);
revoke execute on function private.has_sync_secret() from public,anon,authenticated;
revoke execute on function private.valid_sync_token(text) from public,anon,authenticated;
revoke usage on schema private from anon,authenticated;

select cron.unschedule(jobid)
from cron.job
where jobname='triobrabo-rate-limit-retention';

select cron.schedule(
  'triobrabo-rate-limit-retention',
  '40 4 * * *',
  $$delete from private.api_rate_limits where window_start < now()-interval '2 days'$$
);
