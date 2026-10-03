ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS renudge_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_nudged_at timestamptz;
COMMENT ON COLUMN public.contacts.last_notified_for_nudge_at IS 'DEPRECATED: use last_nudged_at and nudge_events for notification cycles';

CREATE TABLE public.nudge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('notified', 'renudged', 'skipped', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nudge_events TO authenticated;
GRANT ALL ON public.nudge_events TO service_role;
ALTER TABLE public.nudge_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own nudge events" ON public.nudge_events FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX nudge_events_contact_created_idx ON public.nudge_events (contact_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.claim_contact_nudge(p_contact_id uuid, p_expected_at timestamptz, p_expected_count integer, p_type text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id uuid;
BEGIN
  IF p_type NOT IN ('notified', 'renudged') THEN RETURN false; END IF;
  UPDATE public.contacts
  SET last_nudged_at = now(), renudge_count = CASE WHEN p_type = 'renudged' THEN renudge_count + 1 ELSE renudge_count END,
      last_notified_for_nudge_at = next_nudge_at
  WHERE id = p_contact_id AND archived = false AND next_nudge_at = p_expected_at
    AND next_nudge_at <= now() AND renudge_count = p_expected_count
    AND (last_nudged_at IS NULL OR last_nudged_at < (now() - interval '12 hours'))
    AND ((p_type = 'notified' AND last_notified_for_nudge_at IS DISTINCT FROM next_nudge_at)
      OR (p_type = 'renudged' AND last_notified_for_nudge_at = next_nudge_at AND renudge_count < 2))
  RETURNING user_id INTO v_user_id;
  IF v_user_id IS NULL THEN RETURN false; END IF;
  INSERT INTO public.nudge_events (user_id, contact_id, event_type) VALUES (v_user_id, p_contact_id, p_type);
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.claim_contact_nudge(uuid, timestamptz, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_contact_nudge(uuid, timestamptz, integer, text) TO service_role;

CREATE OR REPLACE FUNCTION public.act_on_overdue_nudge(p_contact_id uuid, p_action text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.contacts%ROWTYPE;
BEGIN
  IF p_action NOT IN ('skipped', 'completed') THEN RAISE EXCEPTION 'Invalid nudge action'; END IF;
  SELECT * INTO c FROM public.contacts WHERE id = p_contact_id AND user_id = auth.uid() AND archived = false FOR UPDATE;
  IF NOT FOUND OR c.next_nudge_at IS NULL OR c.next_nudge_at > now() THEN RAISE EXCEPTION 'Overdue contact not found'; END IF;
  IF p_action = 'completed' THEN
    UPDATE public.contacts SET archived = true, last_notified_for_nudge_at = c.next_nudge_at WHERE id = c.id;
  ELSE
    UPDATE public.contacts SET
      next_nudge_at = CASE c.nudge_interval_unit
        WHEN 'day' THEN now() + make_interval(days => greatest(c.nudge_interval_value, 1))
        WHEN 'week' THEN now() + make_interval(days => greatest(c.nudge_interval_value, 1) * 7)
        ELSE now() + make_interval(months => greatest(c.nudge_interval_value, 1)) END,
      renudge_count = 0, last_nudged_at = NULL, last_notified_for_nudge_at = NULL
    WHERE id = c.id;
  END IF;
  INSERT INTO public.nudge_events (user_id, contact_id, event_type) VALUES (c.user_id, c.id, p_action);
END $$;
REVOKE ALL ON FUNCTION public.act_on_overdue_nudge(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.act_on_overdue_nudge(uuid, text) TO authenticated;
