-- Keep production data lean without removing active giveaways or device preferences.
select cron.unschedule(jobid)
from cron.job
where jobname = 'triobrabo-database-retention';

select cron.schedule(
  'triobrabo-database-retention',
  '35 4 * * *',
  $job$
    -- Delivery history is only needed temporarily for auditing and deduplication.
    delete from public.push_deliveries
    where updated_at < now() - interval '90 days';

    -- Disabled browser subscriptions no longer receive notifications.
    delete from public.push_subscriptions
    where active = false
      and updated_at < now() - interval '30 days';

    -- Preserve every live/recent giveaway, while removing obsolete catalog entries.
    delete from public.games
    where is_active = false
      and updated_at < now() - interval '90 days'
      and coalesce(ends_at, updated_at) < now() - interval '90 days';

    -- Operational logs have short diagnostic value and otherwise grow forever.
    delete from net._http_response
    where created < now() - interval '7 days';

    delete from cron.job_run_details
    where end_time < now() - interval '30 days';
  $job$
);
