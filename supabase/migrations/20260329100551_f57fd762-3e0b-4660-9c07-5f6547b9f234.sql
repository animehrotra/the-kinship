
-- Add new flexible nudge columns
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS nudge_interval_value integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS nudge_interval_unit text NOT NULL DEFAULT 'month',
  ADD COLUMN IF NOT EXISTS nudge_start_date date,
  ADD COLUMN IF NOT EXISTS nudge_end_date date;

-- Migrate existing data from nudge_frequency to new columns
UPDATE public.contacts SET nudge_interval_value = 1, nudge_interval_unit = 'day' WHERE nudge_frequency = 'weekly' AND nudge_interval_unit = 'month';
UPDATE public.contacts SET nudge_interval_value = 1, nudge_interval_unit = 'week' WHERE nudge_frequency = 'weekly';
UPDATE public.contacts SET nudge_interval_value = 2, nudge_interval_unit = 'week' WHERE nudge_frequency = 'biweekly';
UPDATE public.contacts SET nudge_interval_value = 1, nudge_interval_unit = 'month' WHERE nudge_frequency = 'monthly';
UPDATE public.contacts SET nudge_interval_value = 3, nudge_interval_unit = 'month' WHERE nudge_frequency = 'quarterly';
