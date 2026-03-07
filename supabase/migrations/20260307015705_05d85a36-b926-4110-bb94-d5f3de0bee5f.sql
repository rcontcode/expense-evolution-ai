
-- Revoke direct RPC access to internal_award_beta_points from all public roles
-- Trigger functions (where auth.uid() IS NULL) will continue to work correctly
REVOKE EXECUTE ON FUNCTION public.internal_award_beta_points(uuid, integer, text)
  FROM authenticated, anon, public;
