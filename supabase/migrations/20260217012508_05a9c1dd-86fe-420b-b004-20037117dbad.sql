-- Remove duplicate SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Revoke anon access to profiles table
REVOKE ALL ON public.profiles FROM anon;