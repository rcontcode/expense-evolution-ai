-- FASE 1: SECURITY HARDENING

-- 1.1 Fix profiles RLS - users should ONLY see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- 1.2 Fix exchange_rates - restrict INSERT to admins only (using SECURITY DEFINER function)
-- First, create a helper function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role = 'admin'::public.user_role
  )
$$;

-- Update exchange_rates policies - anyone can SELECT, only admins can INSERT
DROP POLICY IF EXISTS "Anyone can view exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Authenticated users can insert exchange rates" ON public.exchange_rates;

CREATE POLICY "Anyone can view exchange rates" 
ON public.exchange_rates 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert exchange rates" 
ON public.exchange_rates 
FOR INSERT 
TO authenticated 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update exchange rates" 
ON public.exchange_rates 
FOR UPDATE 
TO authenticated 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete exchange rates" 
ON public.exchange_rates 
FOR DELETE 
TO authenticated 
USING (public.is_admin(auth.uid()));

-- 1.3 Fix increment_usage function - add auth.uid() verification
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_usage_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_period DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  -- SECURITY: Verify the caller is incrementing their own usage
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify another user''s usage';
  END IF;

  INSERT INTO public.usage_tracking (user_id, period_start)
  VALUES (p_user_id, v_current_period)
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
  IF p_usage_type = 'expense' THEN
    UPDATE public.usage_tracking SET expenses_count = expenses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'income' THEN
    UPDATE public.usage_tracking SET incomes_count = incomes_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'ocr' THEN
    UPDATE public.usage_tracking SET ocr_scans_count = ocr_scans_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'contract' THEN
    UPDATE public.usage_tracking SET contract_analyses_count = contract_analyses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'bank' THEN
    UPDATE public.usage_tracking SET bank_analyses_count = bank_analyses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  END IF;
  
  RETURN TRUE;
END;
$$;