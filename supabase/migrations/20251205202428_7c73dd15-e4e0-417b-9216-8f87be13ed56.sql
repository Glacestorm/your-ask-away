-- Schedule check-low-performance to run every Monday at 9:00 AM
SELECT cron.schedule(
  'check-low-performance-weekly',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/check-low-performance',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_ANON_KEY'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);