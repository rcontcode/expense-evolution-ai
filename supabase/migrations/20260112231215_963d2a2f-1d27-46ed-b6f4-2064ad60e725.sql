-- Create storage bucket for beta screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('beta-screenshots', 'beta-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for beta screenshots
CREATE POLICY "Users can upload their own beta screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'beta-screenshots' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view beta screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'beta-screenshots');

CREATE POLICY "Users can delete their own screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'beta-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);

-- System status alerts table for notifying beta testers
CREATE TABLE public.system_status_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('maintenance', 'bug', 'outage', 'update', 'info')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  title_en TEXT,
  message TEXT NOT NULL,
  message_en TEXT,
  is_active BOOLEAN DEFAULT true,
  estimated_resolution TEXT,
  estimated_resolution_en TEXT,
  affected_features TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for system alerts
ALTER TABLE public.system_status_alerts ENABLE ROW LEVEL SECURITY;

-- All beta testers can view system alerts
CREATE POLICY "Beta testers can view system alerts"
ON public.system_status_alerts FOR SELECT
USING (
  auth.uid() IS NOT NULL AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_beta_tester = true)
);

-- Only admins can manage system alerts
CREATE POLICY "Admins can manage system alerts"
ON public.system_status_alerts FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Beta referral codes table - each tester gets their own referral code
CREATE TABLE public.beta_referral_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  max_referrals INTEGER DEFAULT 3,
  current_referrals INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own referral code
CREATE POLICY "Users can view their own referral code"
ON public.beta_referral_codes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own referral code"
ON public.beta_referral_codes FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all referral codes
CREATE POLICY "Admins can manage all referral codes"
ON public.beta_referral_codes FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Allow insert for the system to create referral codes
CREATE POLICY "System can create referral codes"
ON public.beta_referral_codes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Table to track referrals
CREATE TABLE public.beta_referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  referred_id UUID NOT NULL REFERENCES auth.users(id),
  referral_code_id UUID NOT NULL REFERENCES public.beta_referral_codes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_referrals ENABLE ROW LEVEL SECURITY;

-- Users can view referrals they made
CREATE POLICY "Users can view their referrals"
ON public.beta_referrals FOR SELECT
USING (auth.uid() = referrer_id);

-- Admins can view all referrals
CREATE POLICY "Admins can view all referrals"
ON public.beta_referrals FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Function to create referral code for new beta testers
CREATE OR REPLACE FUNCTION public.create_beta_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  user_name TEXT;
BEGIN
  -- Only create if user just became a beta tester
  IF NEW.is_beta_tester = true AND (OLD.is_beta_tester IS NULL OR OLD.is_beta_tester = false) THEN
    -- Get user's name or email prefix for personalized code
    SELECT COALESCE(
      UPPER(SUBSTRING(full_name FROM 1 FOR 4)),
      UPPER(SUBSTRING(email FROM 1 FOR 4))
    ) INTO user_name FROM public.profiles WHERE id = NEW.id;
    
    -- Generate unique code
    new_code := user_name || '-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 4));
    
    -- Create referral code with 3 referrals
    INSERT INTO public.beta_referral_codes (user_id, code, max_referrals)
    VALUES (NEW.id, new_code, 3)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create referral code when user becomes beta tester
CREATE TRIGGER on_beta_tester_activated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_beta_referral_code();

-- Function to use a referral code
CREATE OR REPLACE FUNCTION public.use_beta_referral_code(p_code TEXT, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_referral_record RECORD;
BEGIN
  -- Find the referral code
  SELECT * INTO v_referral_record
  FROM public.beta_referral_codes
  WHERE code = UPPER(TRIM(p_code)) AND is_active = true;
  
  IF v_referral_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código de referido inválido');
  END IF;
  
  -- Can't use own code
  IF v_referral_record.user_id = p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes usar tu propio código');
  END IF;
  
  -- Check if max referrals reached
  IF v_referral_record.current_referrals >= v_referral_record.max_referrals THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este código de referido ya alcanzó su límite');
  END IF;
  
  -- Check if already referred
  IF EXISTS (SELECT 1 FROM public.beta_referrals WHERE referred_id = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya fuiste referido anteriormente');
  END IF;
  
  -- Activate beta tester status
  UPDATE public.profiles SET is_beta_tester = true WHERE id = p_user_id;
  
  -- Record the referral
  INSERT INTO public.beta_referrals (referrer_id, referred_id, referral_code_id)
  VALUES (v_referral_record.user_id, p_user_id, v_referral_record.id);
  
  -- Increment referral count
  UPDATE public.beta_referral_codes 
  SET current_referrals = current_referrals + 1, updated_at = now()
  WHERE id = v_referral_record.id;
  
  -- Bonus: give referrer extra referral slot
  UPDATE public.beta_referral_codes 
  SET max_referrals = max_referrals + 1
  WHERE user_id = v_referral_record.user_id;
  
  RETURN jsonb_build_object('success', true, 'message', '¡Bienvenido al programa beta!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;