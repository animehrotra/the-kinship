
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

CREATE POLICY "Admins can update feedback"
  ON public.feedback FOR UPDATE
  TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "Admins can delete feedback"
  ON public.feedback FOR DELETE
  TO authenticated
  USING (has_role('admin'::app_role));

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.cleanup_closed_feedback()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.feedback
  WHERE closed_at IS NOT NULL
    AND closed_at < now() - INTERVAL '30 days';
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-closed-feedback-daily') THEN
    PERFORM cron.schedule(
      'cleanup-closed-feedback-daily',
      '0 3 * * *',
      $cron$SELECT public.cleanup_closed_feedback();$cron$
    );
  END IF;
END $$;
