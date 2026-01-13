
-- Add beta expiration tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS beta_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS beta_extended_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS beta_extension_reason TEXT;

-- Function to activate beta with expiration (90 days default)
CREATE OR REPLACE FUNCTION public.activate_beta_tester(
  p_user_id UUID,
  p_days INTEGER DEFAULT 90
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    is_beta_tester = true,
    beta_expires_at = NOW() + (p_days || ' days')::INTERVAL
  WHERE id = p_user_id;
END;
$$;

-- Function to extend beta access (admin only)
CREATE OR REPLACE FUNCTION public.extend_beta_access(
  p_user_id UUID,
  p_days INTEGER,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can extend beta access';
  END IF;

  UPDATE public.profiles
  SET 
    beta_expires_at = COALESCE(beta_expires_at, NOW()) + (p_days || ' days')::INTERVAL,
    beta_extended_by = auth.uid(),
    beta_extension_reason = COALESCE(p_reason, beta_extension_reason)
  WHERE id = p_user_id;
END;
$$;

-- Function to revoke beta access (admin only)
CREATE OR REPLACE FUNCTION public.revoke_beta_access(
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can revoke beta access';
  END IF;

  UPDATE public.profiles
  SET 
    is_beta_tester = false,
    beta_expires_at = NOW(),
    beta_extended_by = auth.uid(),
    beta_extension_reason = p_reason
  WHERE id = p_user_id;
END;
$$;

-- Function to check and auto-expire beta testers
CREATE OR REPLACE FUNCTION public.check_beta_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If beta has expired, deactivate
  IF NEW.is_beta_tester = true 
     AND NEW.beta_expires_at IS NOT NULL 
     AND NEW.beta_expires_at < NOW() THEN
    NEW.is_beta_tester := false;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to check expiration on profile access
DROP TRIGGER IF EXISTS check_beta_expiration_trigger ON public.profiles;
CREATE TRIGGER check_beta_expiration_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_beta_expiration();

-- Update existing beta testers with 90 day expiration from now
UPDATE public.profiles
SET beta_expires_at = NOW() + INTERVAL '90 days'
WHERE is_beta_tester = true AND beta_expires_at IS NULL;

-- Update the use_beta_referral_code function to set expiration
CREATE OR REPLACE FUNCTION public.use_beta_referral_code(p_code TEXT, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code RECORD;
  v_referrer_id UUID;
BEGIN
  -- Find the referral code
  SELECT * INTO v_referral_code
  FROM public.beta_referral_codes
  WHERE code = UPPER(p_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive code');
  END IF;

  -- Check if max referrals reached
  IF v_referral_code.current_referrals >= v_referral_code.max_referrals THEN
    RETURN jsonb_build_object('success', false, 'error', 'This code has reached its maximum uses');
  END IF;

  -- Check if user already used a referral
  IF EXISTS (
    SELECT 1 FROM public.beta_referrals WHERE referred_id = p_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already used a referral code');
  END IF;

  v_referrer_id := v_referral_code.user_id;

  -- Activate beta tester status for the new user WITH EXPIRATION
  UPDATE public.profiles
  SET 
    is_beta_tester = true,
    beta_expires_at = NOW() + INTERVAL '90 days'
  WHERE id = p_user_id;

  -- Record the referral
  INSERT INTO public.beta_referrals (referrer_id, referred_id, referral_code_id)
  VALUES (v_referrer_id, p_user_id, v_referral_code.id);

  -- Increment the referral count
  UPDATE public.beta_referral_codes
  SET current_referrals = current_referrals + 1
  WHERE id = v_referral_code.id;

  -- Award points to referrer
  PERFORM public.award_beta_points(v_referrer_id, 100, 'referral');

  -- Give the referrer an extra referral slot as reward
  UPDATE public.beta_referral_codes
  SET max_referrals = max_referrals + 1
  WHERE user_id = v_referrer_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Beta access activated for 90 days!'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.activate_beta_tester TO authenticated;
GRANT EXECUTE ON FUNCTION public.extend_beta_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_beta_access TO authenticated;
