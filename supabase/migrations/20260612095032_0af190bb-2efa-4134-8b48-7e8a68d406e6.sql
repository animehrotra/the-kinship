-- Remove default PUBLIC execute access so SECURITY DEFINER functions are not callable by anon
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(app_role) FROM PUBLIC;