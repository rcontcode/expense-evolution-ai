-- Primero eliminar la función existente
DROP FUNCTION IF EXISTS public.increment_usage(UUID, TEXT);

-- Recrear función con soporte para 'voice'
CREATE FUNCTION public.increment_usage(p_user_id UUID, p_usage_type TEXT)
RETURNS VOID AS $$
DECLARE
  v_current_period DATE;
BEGIN
  v_current_period := date_trunc('month', now())::date;
  
  -- Crear registro si no existe
  INSERT INTO public.usage_tracking (user_id, period_start)
  VALUES (p_user_id, v_current_period)
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
  -- Incrementar el contador correspondiente
  IF p_usage_type = 'expense' THEN
    UPDATE public.usage_tracking 
    SET expenses_count = expenses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'income' THEN
    UPDATE public.usage_tracking 
    SET incomes_count = incomes_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'ocr' THEN
    UPDATE public.usage_tracking 
    SET ocr_scans_count = ocr_scans_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'contract' THEN
    UPDATE public.usage_tracking 
    SET contract_analyses_count = contract_analyses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'bank' THEN
    UPDATE public.usage_tracking 
    SET bank_analyses_count = bank_analyses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'voice' THEN
    UPDATE public.usage_tracking 
    SET voice_requests_count = voice_requests_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;