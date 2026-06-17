
-- Add minute-level granularity for nudge notifications and default to 8:30 AM local
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_minute smallint NOT NULL DEFAULT 30 CHECK (notify_minute IN (0, 30));

-- Switch the column-level default for notify_hour to 8 (8:30 AM combined with notify_minute)
ALTER TABLE public.profiles ALTER COLUMN notify_hour SET DEFAULT 8;

-- Migrate users still on the previous default (9:00) to the new default (8:30).
-- Customized rows keep their hour; their minute stays at the safe 0.
UPDATE public.profiles SET notify_hour = 8, notify_minute = 30 WHERE notify_hour = 9;
UPDATE public.profiles SET notify_minute = 0 WHERE notify_hour <> 8;

-- Run nudge check every 30 minutes so :30 send times fire on schedule
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'kinship-check-nudges-hourly';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'daily-nudge-check';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

SELECT cron.schedule(
  'kinship-check-nudges-half-hourly',
  '0,30 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://wpkzcofvflleuqoerejb.supabase.co/functions/v1/check-nudges',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwa3pjb2Z2ZmxsZXVxb2VyZWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2Nzk2NjYsImV4cCI6MjA4OTI1NTY2Nn0.yUtaHxbta6q4CqpWLfDD8zQX-SgO3FJuiUvgtGAbRnk"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  );
  $cron$
);
