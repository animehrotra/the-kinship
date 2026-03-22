
-- Create new enum with updated values
CREATE TYPE public.circle_tier_new AS ENUM ('inner_circle', 'friends', 'acquaintances', 'family', 'others');

-- Alter column to text first, then update, then cast to new enum
ALTER TABLE public.contacts 
  ALTER COLUMN circle DROP DEFAULT,
  ALTER COLUMN circle TYPE text USING circle::text;

-- Map old values to new
UPDATE public.contacts SET circle = 'friends' WHERE circle = 'close_friends';
UPDATE public.contacts SET circle = 'others' WHERE circle = 'extended';

-- Cast to new enum
ALTER TABLE public.contacts 
  ALTER COLUMN circle TYPE public.circle_tier_new USING circle::public.circle_tier_new,
  ALTER COLUMN circle SET DEFAULT 'others'::public.circle_tier_new;

-- Drop old enum and rename new one
DROP TYPE public.circle_tier;
ALTER TYPE public.circle_tier_new RENAME TO circle_tier;
