-- Tabla de códigos de invitación beta
CREATE TABLE public.beta_invitation_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '90 days'),
  is_active BOOLEAN DEFAULT true
);

-- Tabla de registro de usos
CREATE TABLE public.beta_code_uses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id UUID REFERENCES public.beta_invitation_codes(id) ON DELETE CASCADE,
  used_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Agregar columna is_beta_tester a profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_beta_tester BOOLEAN DEFAULT false;

-- RLS para beta_invitation_codes
ALTER TABLE public.beta_invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_code_uses ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver los códigos
CREATE POLICY "Only admins can view beta codes" ON public.beta_invitation_codes
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert beta codes" ON public.beta_invitation_codes
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update beta codes" ON public.beta_invitation_codes
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete beta codes" ON public.beta_invitation_codes
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Usuarios pueden ver sus propios usos de código
CREATE POLICY "Users can view own code uses" ON public.beta_code_uses
  FOR SELECT USING (used_by = auth.uid());

-- Función RPC SEGURA para validar código (sin exponer la tabla)
CREATE OR REPLACE FUNCTION public.validate_beta_invitation_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record RECORD;
BEGIN
  SELECT id, max_uses, current_uses, expires_at, is_active
  INTO v_code_record
  FROM public.beta_invitation_codes
  WHERE code = UPPER(TRIM(p_code)) AND is_active = true;
  
  IF v_code_record IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;
  
  IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;
  
  IF v_code_record.current_uses >= v_code_record.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'max_uses_reached');
  END IF;
  
  RETURN jsonb_build_object('valid', true, 'reason', 'ok');
END;
$$;

-- Función RPC para usar el código
CREATE OR REPLACE FUNCTION public.use_beta_invitation_code(p_code text, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_record RECORD;
BEGIN
  SELECT * INTO v_code_record
  FROM public.beta_invitation_codes
  WHERE code = UPPER(TRIM(p_code)) AND is_active = true;
  
  IF v_code_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido');
  END IF;
  
  IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código expirado');
  END IF;
  
  IF v_code_record.current_uses >= v_code_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código agotado');
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.beta_code_uses WHERE code_id = v_code_record.id AND used_by = p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya usaste este código');
  END IF;
  
  -- Activar beta tester
  UPDATE public.profiles SET is_beta_tester = true WHERE id = p_user_id;
  
  -- Registrar uso
  INSERT INTO public.beta_code_uses (code_id, used_by) VALUES (v_code_record.id, p_user_id);
  
  -- Incrementar contador
  UPDATE public.beta_invitation_codes SET current_uses = current_uses + 1, updated_at = now() WHERE id = v_code_record.id;
  
  RETURN jsonb_build_object('success', true, 'message', '¡Acceso beta activado!');
END;
$$;

-- Insertar 10 códigos pre-generados para EvoFinz
INSERT INTO public.beta_invitation_codes (code, max_uses, expires_at) VALUES
  ('EVOFINZ-BETA-2025-A1', 1, '2025-12-31'),
  ('EVOFINZ-BETA-2025-A2', 1, '2025-12-31'),
  ('EVOFINZ-BETA-2025-A3', 1, '2025-12-31'),
  ('EVOFINZ-BETA-2025-A4', 1, '2025-12-31'),
  ('EVOFINZ-BETA-2025-A5', 1, '2025-12-31'),
  ('EVOFINZ-BETA-2025-B1', 1, '2025-12-31'),
  ('EVOFINZ-BETA-2025-B2', 1, '2025-12-31'),
  ('EVOFINZ-BETA-2025-B3', 1, '2025-12-31'),
  ('EVOFINZ-BETA-2025-B4', 1, '2025-12-31'),
  ('EVOFINZ-BETA-2025-B5', 1, '2025-12-31');