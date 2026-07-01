-- Add appreciation prompt columns to onboarding_state
ALTER TABLE public.onboarding_state
  ADD COLUMN seen_appreciation_prompt boolean NOT NULL DEFAULT false,
  ADD COLUMN appreciation_response text,
  ADD COLUMN appreciation_sentiment text;
