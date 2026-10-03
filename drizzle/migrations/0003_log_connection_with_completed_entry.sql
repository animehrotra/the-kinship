CREATE OR REPLACE FUNCTION public.log_contact_connection(
  p_contact_id uuid,
  p_interaction_type public.interaction_type,
  p_notes text,
  p_interaction_at timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.contacts%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_interaction_type IS NULL OR p_interaction_at IS NULL OR p_interaction_at > now() + interval '1 day' THEN
    RAISE EXCEPTION 'A valid connection type and date are required';
  END IF;

  SELECT * INTO c
  FROM public.contacts
  WHERE id = p_contact_id AND user_id = auth.uid() AND archived = false
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active contact not found';
  END IF;

  INSERT INTO public.interactions (contact_id, user_id, type, notes, created_at)
  VALUES (c.id, c.user_id, p_interaction_type, NULLIF(btrim(p_notes), ''), p_interaction_at);

  UPDATE public.contacts
  SET last_interaction_at = p_interaction_at,
      next_nudge_at = CASE c.nudge_interval_unit
        WHEN 'day' THEN p_interaction_at + make_interval(days => greatest(c.nudge_interval_value, 1))
        WHEN 'week' THEN p_interaction_at + make_interval(days => greatest(c.nudge_interval_value, 1) * 7)
        ELSE p_interaction_at + make_interval(months => greatest(c.nudge_interval_value, 1))
      END,
      renudge_count = 0,
      last_nudged_at = NULL,
      last_notified_for_nudge_at = NULL
  WHERE id = c.id;

  INSERT INTO public.nudge_events (user_id, contact_id, event_type)
  VALUES (c.user_id, c.id, 'completed');
END;
$$;
REVOKE ALL ON FUNCTION public.log_contact_connection(uuid, public.interaction_type, text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_contact_connection(uuid, public.interaction_type, text, timestamptz) TO authenticated;