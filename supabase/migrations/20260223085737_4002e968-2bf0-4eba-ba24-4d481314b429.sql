
-- Fix increment_voice_usage: add caller verification
CREATE OR REPLACE FUNCTION public.increment_voice_usage(p_user_id uuid, p_minutes numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify caller is modifying their own usage
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s usage';
  END IF;

  INSERT INTO public.usage_tracking (user_id, period_start, voice_minutes_used)
  VALUES (
    p_user_id, 
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    p_minutes
  )
  ON CONFLICT (user_id, period_start) 
  DO UPDATE SET 
    voice_minutes_used = COALESCE(usage_tracking.voice_minutes_used, 0) + p_minutes,
    updated_at = NOW();
END;
$function$;

-- Fix increment_usage: add caller verification
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_usage_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_period DATE;
BEGIN
  -- Verify caller is modifying their own usage
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s usage';
  END IF;

  v_current_period := date_trunc('month', now())::date;
  
  INSERT INTO public.usage_tracking (user_id, period_start)
  VALUES (p_user_id, v_current_period)
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
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
$function$;
