-- Table for capturing referral leads with consent
CREATE TABLE public.referral_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  referral_code TEXT NOT NULL,
  referrer_id UUID REFERENCES auth.users(id),
  source TEXT DEFAULT 'referral_link',
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  converted_at TIMESTAMPTZ,
  converted_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.referral_leads ENABLE ROW LEVEL SECURITY;

-- Admins can see all leads
CREATE POLICY "Admins can view all referral leads"
  ON public.referral_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Referrers can see their own leads
CREATE POLICY "Referrers can view their own leads"
  ON public.referral_leads
  FOR SELECT
  USING (referrer_id = auth.uid());

-- Allow public insert (for lead capture before signup)
CREATE POLICY "Anyone can submit referral leads"
  ON public.referral_leads
  FOR INSERT
  WITH CHECK (true);

-- Create unified code validation function
CREATE OR REPLACE FUNCTION public.validate_any_beta_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_referral_code RECORD;
  v_invitation_code RECORD;
BEGIN
  -- First check if it's a referral code (personal codes like RUDY-A1B2C3)
  SELECT * INTO v_referral_code
  FROM public.beta_referral_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
    AND current_referrals < max_referrals;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'valid', true,
      'type', 'referral',
      'code', v_referral_code.code,
      'referrer_id', v_referral_code.user_id,
      'message', 'Código de invitación personal válido'
    );
  END IF;
  
  -- Then check if it's an admin invitation code
  SELECT * INTO v_invitation_code
  FROM public.beta_invitation_codes
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = true
    AND current_uses < max_uses
    AND (expires_at IS NULL OR expires_at > now());
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'valid', true,
      'type', 'invitation',
      'code', v_invitation_code.code,
      'code_id', v_invitation_code.id,
      'message', 'Código de invitación válido'
    );
  END IF;
  
  -- Check if code exists but is exhausted
  IF EXISTS (SELECT 1 FROM public.beta_referral_codes WHERE UPPER(code) = UPPER(p_code)) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'type', 'referral_exhausted',
      'message', 'Este código ha alcanzado su límite de invitaciones'
    );
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.beta_invitation_codes WHERE UPPER(code) = UPPER(p_code)) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'type', 'invitation_exhausted',
      'message', 'Este código ha expirado o alcanzado su límite'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', false,
    'type', 'not_found',
    'message', 'Código no encontrado'
  );
END;
$$;

-- Function to capture referral lead
CREATE OR REPLACE FUNCTION public.capture_referral_lead(
  p_email TEXT,
  p_name TEXT,
  p_referral_code TEXT,
  p_marketing_consent BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_lead_id UUID;
BEGIN
  -- Get referrer ID from code
  SELECT user_id INTO v_referrer_id
  FROM public.beta_referral_codes
  WHERE UPPER(code) = UPPER(p_referral_code);
  
  -- Check if lead already exists
  IF EXISTS (SELECT 1 FROM public.referral_leads WHERE LOWER(email) = LOWER(p_email)) THEN
    -- Update existing lead
    UPDATE public.referral_leads
    SET 
      name = COALESCE(p_name, name),
      marketing_consent = p_marketing_consent,
      updated_at = now()
    WHERE LOWER(email) = LOWER(p_email)
    RETURNING id INTO v_lead_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'lead_id', v_lead_id,
      'is_update', true
    );
  END IF;
  
  -- Insert new lead
  INSERT INTO public.referral_leads (email, name, referral_code, referrer_id, marketing_consent)
  VALUES (p_email, p_name, p_referral_code, v_referrer_id, p_marketing_consent)
  RETURNING id INTO v_lead_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'is_update', false
  );
END;
$$;

-- Function to mark lead as converted when they register
CREATE OR REPLACE FUNCTION public.convert_referral_lead()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.referral_leads
  SET 
    converted_at = now(),
    converted_user_id = NEW.id,
    updated_at = now()
  WHERE LOWER(email) = LOWER(NEW.email)
    AND converted_at IS NULL;
  
  RETURN NEW;
END;
$$;

-- Trigger to convert leads when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_convert_lead ON auth.users;
CREATE TRIGGER on_auth_user_created_convert_lead
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.convert_referral_lead();

-- Index for faster lookups
CREATE INDEX idx_referral_leads_email ON public.referral_leads(LOWER(email));
CREATE INDEX idx_referral_leads_referrer ON public.referral_leads(referrer_id);
CREATE INDEX idx_referral_leads_converted ON public.referral_leads(converted_at) WHERE converted_at IS NULL;