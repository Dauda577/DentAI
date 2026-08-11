-- DentAI: weekly digest schedule
-- Run this in the Supabase Dashboard: SQL Editor > New query > paste > Run
-- Prerequisites (run in this order):
--   1. Enable pg_cron + pg_net + supabase_vault in Database > Extensions
--   2. Deploy the send-weekly-digest Edge Function
--   3. Run this file, replacing <project-ref> and <service_role_key>
--      (Project Settings > API)
-- The digest fires every Monday at 08:00 UTC via net.http_post against the
-- Edge Function. Secrets live in Supabase Vault so the key is never stored
-- in plain SQL.

create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

-- Store credentials in Vault (idempotent by name).
select vault.create_secret(
  'https://<project-ref>.supabase.co/functions/v1/send-weekly-digest',
  'digest_function_url'
);
select vault.create_secret(
  '<service_role_key>',
  'digest_service_role_key'
);

select cron.schedule(
  'weekly-digest',           -- job name (case sensitive, run again to update)
  '0 8 * * 1',               -- Monday 08:00 UTC
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'digest_function_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'digest_service_role_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  ) as request_id;
  $$
);

-- Debugging:
--   select * from cron.job_run_details where jobname = 'weekly-digest' order by start_time desc;
--   select * from net._http_response order by created desc limit 10;
-- Disable without deleting secrets:
--   select cron.unschedule('weekly-digest');