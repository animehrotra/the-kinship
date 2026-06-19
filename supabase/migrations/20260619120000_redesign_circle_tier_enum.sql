-- Redesign circle_tier enum: replace friends/acquaintances/family/others
-- with close/casual/reconnect. inner_circle is preserved. Default is removed
-- so callers must specify a circle explicitly.

CREATE TYPE public.circle_tier_new AS ENUM ('inner_circle', 'close', 'casual', 'reconnect');

ALTER TABLE public.contacts
  ALTER COLUMN circle DROP DEFAULT,
  ALTER COLUMN circle TYPE text USING circle::text;

-- Map removed values onto the closest new bucket.
UPDATE public.contacts SET circle = 'close'     WHERE circle = 'friends';
UPDATE public.contacts SET circle = 'casual'    WHERE circle = 'acquaintances';
UPDATE public.contacts SET circle = 'close'     WHERE circle = 'family';
UPDATE public.contacts SET circle = 'reconnect' WHERE circle = 'others';

ALTER TABLE public.contacts
  ALTER COLUMN circle TYPE public.circle_tier_new USING circle::public.circle_tier_new;

DROP TYPE public.circle_tier;
ALTER TYPE public.circle_tier_new RENAME TO circle_tier;
