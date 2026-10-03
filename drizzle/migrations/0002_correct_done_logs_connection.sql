DROP FUNCTION IF EXISTS public.act_on_overdue_nudge(uuid, text);

CREATE OR REPLACE FUNCTION public.act_on_overdue_nudge(
  p_contact_id uuid,
  p_action text,
  p_interaction_type public.interaction_type DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_interaction_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.contacts%ROWTYPE;
  v_interaction_at timestamptz;
BEGIN
  IF p_action NOT IN ('skipped', 'completed') THEN
    RAISE EXCEPTION 'Invalid nudge action';
  END IF;

  SELECT * INTO c
  FROM public.contacts
  WHERE id = p_contact_id
    AND user_id = auth.uid()
    AND archived = false
  FOR UPDATE;

  IF NOT FOUND OR c.next_nudge_at IS NULL OR c.next_nudge_at > now() THEN
    RAISE EXCEPTION 'Overdue contact not found';
  END IF;

  IF p_action = 'completed' THEN
    IF p_interaction_type IS NULL THEN
      RAISE EXCEPTION 'Interaction type is required';
    END IF;

    v_interaction_at := COALESCE(p_interaction_at, now());

    INSERT INTO public.interactions (contact_id, user_id, type, notes, created_at)
    VALUES (c.id, c.user_id, p_interaction_type, NULLIF(btrim(p_notes), ''), v_interaction_at);

    UPDATE public.contacts
    SET
      last_interaction_at = v_interaction_at,
      next_nudge_at = CASE c.nudge_interval_unit
        WHEN 'day' THEN v_interaction_at + make_interval(days => greatest(c.nudge_interval_value, 1))
        WHEN 'week' THEN v_interaction_at + make_interval(days => greatest(c.nudge_interval_value, 1) * 7)
        ELSE v_interaction_at + make_interval(months => greatest(c.nudge_interval_value, 1))
      END,
      renudge_count = 0,
      last_nudged_at = NULL,
      last_notified_for_nudge_at = NULL
    WHERE id = c.id;
  ELSE
    UPDATE public.contacts
    SET
      next_nudge_at = CASE c.nudge_interval_unit
        WHEN 'day' THEN now() + make_interval(days => greatest(c.nudge_interval_value, 1))
        WHEN 'week' THEN now() + make_interval(days => greatest(c.nudge_interval_value, 1) * 7)
        ELSE now() + make_interval(months => greatest(c.nudge_interval_value, 1))
      END,
      renudge_count = 0,
      last_nudged_at = NULL,
      last_notified_for_nudge_at = NULL
    WHERE id = c.id;
  END IF;

  INSERT INTO public.nudge_events (user_id, contact_id, event_type)
  VALUES (c.user_id, c.id, p_action);
END;
$$;

REVOKE ALL ON FUNCTION public.act_on_overdue_nudge(uuid, text, public.interaction_type, text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.act_on_overdue_nudge(uuid, text, public.interaction_type, text, timestamptz) TO authenticated;