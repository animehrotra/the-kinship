-- Add milestone tracking columns to onboarding_state
ALTER TABLE public.onboarding_state
  ADD COLUMN milestone_1_seen boolean NOT NULL DEFAULT false,
  ADD COLUMN milestone_2_seen boolean NOT NULL DEFAULT false,
  ADD COLUMN milestone_3_seen boolean NOT NULL DEFAULT false,
  ADD COLUMN positive_response boolean NOT NULL DEFAULT false;

-- Create appreciation_responses table
CREATE TABLE public.appreciation_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sentiment text NOT NULL,
  response_text text,
  source text NOT NULL,
  is_testimonial_candidate boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appreciation_responses_source_check
    CHECK (source IN ('spontaneous', 'milestone_1', 'milestone_2', 'milestone_3'))
);

-- RLS policies
ALTER TABLE public.appreciation_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own appreciation responses"
  ON public.appreciation_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all appreciation responses"
  ON public.appreciation_responses FOR SELECT
  USING (public.has_role('admin'));

CREATE POLICY "Admins can update appreciation responses"
  ON public.appreciation_responses FOR UPDATE
  USING (public.has_role('admin'));
