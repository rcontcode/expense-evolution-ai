
CREATE OR REPLACE FUNCTION public.get_or_create_monthly_usage(p_user_id uuid)
 RETURNS usage_tracking
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_usage public.usage_tracking;
  v_current_period DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  -- Verify caller is accessing their own data
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access another user''s usage data';
  END IF;

  SELECT * INTO v_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id AND period_start = v_current_period;
  
  IF v_usage IS NULL THEN
    INSERT INTO public.usage_tracking (user_id, period_start)
    VALUES (p_user_id, v_current_period)
    RETURNING * INTO v_usage;
  END IF;
  
  RETURN v_usage;
END;
$function$;
