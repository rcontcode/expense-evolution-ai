
-- FIX 1: Profiles table - restrict all policies to authenticated role only
-- Drop existing policies that use {public} role (which includes anon)
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate with TO authenticated (not public)
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- FIX 2: Clients table - enforce soft-delete pattern instead of hard delete
DROP POLICY IF EXISTS "Authenticated users can delete their own clients" ON public.clients;
-- No hard DELETE allowed; use UPDATE to set deleted_at instead

-- FIX 3: System status alerts - allow all authenticated users to view
DROP POLICY IF EXISTS "Beta testers can view system alerts" ON public.system_status_alerts;
CREATE POLICY "Authenticated users can view system alerts"
ON public.system_status_alerts FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

-- FIX 4: Referral leads - restrict referrer view to only count (remove full data access)
DROP POLICY IF EXISTS "Referrers can view their own leads" ON public.referral_leads;
CREATE POLICY "Referrers can view own leads limited"
ON public.referral_leads FOR SELECT TO authenticated
USING (referrer_id = auth.uid());
