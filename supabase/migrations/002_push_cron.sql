-- 002_push_cron.sql
-- Prerequisites: pg_cron and pg_net extensions must be enabled in your Supabase project.
-- Enable them via: Supabase Dashboard > Database > Extensions > pg_cron, pg_net
--
-- IMPORTANT: Replace the placeholders before running:
--   PROJECT_REF   → Your Supabase project reference ID (e.g. abcdefghijklmnop)
--   SERVICE_ROLE_KEY → Your Supabase service role key (Settings > API > Service role key)
--
-- This schedules the habit-reminder Edge Function to run every hour on the hour.
-- The function itself filters for users whose local time is 10PM.

SELECT cron.schedule(
  'habit-push-notifications',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/send-habit-reminders',
    headers := '{"Authorization": "Bearer SERVICE_ROLE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
