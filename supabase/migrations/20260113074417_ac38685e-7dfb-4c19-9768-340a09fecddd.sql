-- Function to auto-generate referral code when beta status is activated
CREATE OR REPLACE FUNCTION public.generate_beta_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  v_code TEXT;
  v_attempts INT := 0;
  v_user_name TEXT;
BEGIN
  -- Only trigger when is_beta_tester changes to true
  IF NEW.is_beta_tester = TRUE AND (OLD.is_beta_tester IS NULL OR OLD.is_beta_tester = FALSE) THEN
    -- Check if user already has a referral code
    IF NOT EXISTS (SELECT 1 FROM public.beta_referral_codes WHERE user_id = NEW.id) THEN
      -- Get first part of user's name or email for the code
      v_user_name := COALESCE(
        UPPER(LEFT(REGEXP_REPLACE(NEW.full_name, '[^a-zA-Z]', '', 'g'), 4)),
        UPPER(LEFT(SPLIT_PART(NEW.email, '@', 1), 4))
      );
      
      -- Generate unique code with user prefix
      LOOP
        v_code := v_user_name || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));
        v_attempts := v_attempts + 1;
        
        -- Check if code is unique
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.beta_referral_codes WHERE code = v_code);
        EXIT WHEN v_attempts > 10; -- Prevent infinite loop
      END LOOP;
      
      -- Insert the referral code with 3 initial slots
      INSERT INTO public.beta_referral_codes (user_id, code, max_referrals, current_referrals, is_active)
      VALUES (NEW.id, v_code, 3, 0, TRUE);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-generating referral code
DROP TRIGGER IF EXISTS trigger_generate_beta_referral_code ON public.profiles;
CREATE TRIGGER trigger_generate_beta_referral_code
  AFTER UPDATE OF is_beta_tester ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_beta_referral_code();

-- Also trigger on insert if is_beta_tester is true
CREATE OR REPLACE FUNCTION public.generate_beta_referral_code_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_code TEXT;
  v_attempts INT := 0;
  v_user_name TEXT;
BEGIN
  -- Only trigger when is_beta_tester is true on insert
  IF NEW.is_beta_tester = TRUE THEN
    -- Check if user already has a referral code
    IF NOT EXISTS (SELECT 1 FROM public.beta_referral_codes WHERE user_id = NEW.id) THEN
      -- Get first part of user's name or email for the code
      v_user_name := COALESCE(
        UPPER(LEFT(REGEXP_REPLACE(NEW.full_name, '[^a-zA-Z]', '', 'g'), 4)),
        UPPER(LEFT(SPLIT_PART(NEW.email, '@', 1), 4))
      );
      
      -- Generate unique code with user prefix
      LOOP
        v_code := v_user_name || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));
        v_attempts := v_attempts + 1;
        
        -- Check if code is unique
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.beta_referral_codes WHERE code = v_code);
        EXIT WHEN v_attempts > 10;
      END LOOP;
      
      -- Insert the referral code with 3 initial slots
      INSERT INTO public.beta_referral_codes (user_id, code, max_referrals, current_referrals, is_active)
      VALUES (NEW.id, v_code, 3, 0, TRUE);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_generate_beta_referral_code_insert ON public.profiles;
CREATE TRIGGER trigger_generate_beta_referral_code_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_beta_referral_code_on_insert();

-- Function to use a personal referral code (not invitation code)
CREATE OR REPLACE FUNCTION public.use_beta_referral_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_referral_code RECORD;
  v_referrer_id UUID;
BEGIN
  -- Find the referral code
  SELECT * INTO v_referral_code
  FROM public.beta_referral_codes
  WHERE code = UPPER(p_code) AND is_active = TRUE;
  
  IF v_referral_code IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Código de referido no encontrado o inactivo');
  END IF;
  
  -- Check if code has available slots
  IF v_referral_code.current_referrals >= v_referral_code.max_referrals THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Este código de referido ha alcanzado su límite');
  END IF;
  
  -- Check if user is trying to use their own code
  IF v_referral_code.user_id = p_user_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'No puedes usar tu propio código de referido');
  END IF;
  
  -- Check if user was already referred
  IF EXISTS (SELECT 1 FROM public.beta_referrals WHERE referred_id = p_user_id) THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ya tienes un referidor registrado');
  END IF;
  
  -- Check if user is already a beta tester
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND is_beta_tester = TRUE) THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ya eres un beta tester');
  END IF;
  
  v_referrer_id := v_referral_code.user_id;
  
  -- Record the referral
  INSERT INTO public.beta_referrals (referrer_id, referred_id, referral_code_id)
  VALUES (v_referrer_id, p_user_id, v_referral_code.id);
  
  -- Increment the referral count
  UPDATE public.beta_referral_codes
  SET current_referrals = current_referrals + 1,
      updated_at = NOW()
  WHERE id = v_referral_code.id;
  
  -- Give the referrer an extra slot as reward (bonus for each successful referral)
  UPDATE public.beta_referral_codes
  SET max_referrals = max_referrals + 1
  WHERE user_id = v_referrer_id;
  
  -- Award referral points to the referrer
  UPDATE public.beta_tester_points
  SET referral_points = referral_points + 100,
      total_points = total_points + 100,
      updated_at = NOW()
  WHERE user_id = v_referrer_id;
  
  -- Activate beta status for the new user with 90 days expiration
  UPDATE public.profiles
  SET is_beta_tester = TRUE,
      beta_expires_at = NOW() + INTERVAL '90 days',
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', TRUE, 
    'message', '¡Bienvenido! Tu acceso beta ha sido activado por 90 días.',
    'referrer_id', v_referrer_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Generate referral codes for existing beta testers who don't have one
DO $$
DECLARE
  v_profile RECORD;
  v_code TEXT;
  v_attempts INT;
  v_user_name TEXT;
BEGIN
  FOR v_profile IN 
    SELECT p.id, p.full_name, p.email 
    FROM public.profiles p 
    WHERE p.is_beta_tester = TRUE 
    AND NOT EXISTS (SELECT 1 FROM public.beta_referral_codes WHERE user_id = p.id)
  LOOP
    v_attempts := 0;
    v_user_name := COALESCE(
      UPPER(LEFT(REGEXP_REPLACE(v_profile.full_name, '[^a-zA-Z]', '', 'g'), 4)),
      UPPER(LEFT(SPLIT_PART(v_profile.email, '@', 1), 4))
    );
    
    LOOP
      v_code := v_user_name || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));
      v_attempts := v_attempts + 1;
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.beta_referral_codes WHERE code = v_code);
      EXIT WHEN v_attempts > 10;
    END LOOP;
    
    INSERT INTO public.beta_referral_codes (user_id, code, max_referrals, current_referrals, is_active)
    VALUES (v_profile.id, v_code, 3, 0, TRUE);
  END LOOP;
END $$;