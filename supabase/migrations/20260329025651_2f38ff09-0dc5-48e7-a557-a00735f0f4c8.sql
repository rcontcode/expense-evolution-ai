
-- Step 1: Block client-side INSERT/UPDATE/DELETE on user_roles (CRITICAL privilege escalation fix)
CREATE POLICY "Block client INSERT on user_roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Block client UPDATE on user_roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Block client DELETE on user_roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (false);

-- Step 2: Fix referral_leads - drop public INSERT policy and create authenticated one
DROP POLICY IF EXISTS "Anyone can insert referral leads" ON public.referral_leads;
DROP POLICY IF EXISTS "Public can insert referral leads" ON public.referral_leads;

-- Allow only authenticated users to insert leads (the capture_referral_lead function uses SECURITY DEFINER)
CREATE POLICY "Authenticated users can insert referral leads"
  ON public.referral_leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
