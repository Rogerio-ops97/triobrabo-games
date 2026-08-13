create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- `sync_cron_token` is provisioned separately in Vault so credentials never enter Git.
select cron.unschedule(jobid)
from cron.job
where jobname = 'triobrabo-free-games-sync';

select cron.schedule(
  'triobrabo-free-games-sync',
  '*/15 * * * *',
  $job$
    select net.http_get(
      url := 'https://triobrabo-games.vercel.app/api/sync',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'sync_cron_token' limit 1)
      ),
      timeout_milliseconds := 10000
    );
  $job$
);
