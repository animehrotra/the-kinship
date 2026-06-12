-- Drop the feedback policy that references the old has_role signature
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;

-- Drop the old has_role function so we can recreate it with a safer signature
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- Recreate has_role to use auth.uid() internally instead of accepting arbitrary user_id
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role
  )
$$;

-- Prevent anonymous users from calling has_role via RPC
REVOKE EXECUTE ON FUNCTION public.has_role(app_role) FROM anon;

-- Prevent direct RPC calls to the trigger function (triggers fire internally, RPC is not needed)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Recreate the feedback policy with the new has_role signature
CREATE POLICY "Admins can view all feedback" ON public.feedback
  FOR SELECT TO authenticated
  USING (public.has_role('admin'::app_role));

-- Explicitly block all writes on user_roles from authenticated users
-- Roles are only assigned by the handle_new_user trigger; clients should never write here
CREATE POLICY "Block all inserts on user_roles" ON public.user_roles
  AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Block all updates on user_roles" ON public.user_roles
  AS RESTRICTIVE FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Block all deletes on user_roles" ON public.user_roles
  AS RESTRICTIVE FOR DELETE TO authenticated USING (false);