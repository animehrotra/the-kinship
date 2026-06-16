ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_hour smallint NOT NULL DEFAULT 9 CHECK (notify_hour >= 0 AND notify_hour <= 23),
  ADD COLUMN IF NOT EXISTS notify_timezone text NOT NULL DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS last_nudge_notified_on date;