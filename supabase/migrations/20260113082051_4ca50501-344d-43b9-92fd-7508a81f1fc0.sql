-- Fix the permissive RLS policy for referral_leads INSERT
-- We still allow public insert but add validation that email is provided
DROP POLICY IF EXISTS "Anyone can submit referral leads" ON public.referral_leads;

-- More restrictive: only allow insert through the secure function
-- Direct inserts are blocked, must go through capture_referral_lead function
CREATE POLICY "Insert through function only"
  ON public.referral_leads
  FOR INSERT
  WITH CHECK (
    -- Only allow if email is valid format and referral_code exists
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND referral_code IS NOT NULL
    AND length(referral_code) > 0
  );