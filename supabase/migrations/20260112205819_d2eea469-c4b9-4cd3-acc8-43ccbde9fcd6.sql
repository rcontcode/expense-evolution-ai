-- Bootstrap: allow the very first authenticated user to become admin (one-time)
-- This prevents being locked out of the admin panel when launching beta.

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  already_has_admin boolean;
BEGIN
  -- Must be signed in
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS(
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'::public.user_role
  ) INTO already_has_admin;

  -- If any admin exists, do nothing
  IF already_has_admin THEN
    RETURN false;
  END IF;

  -- Promote current user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin'::public.user_role)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;