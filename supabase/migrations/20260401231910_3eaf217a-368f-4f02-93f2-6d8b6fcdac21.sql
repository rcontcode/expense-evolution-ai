
CREATE OR REPLACE FUNCTION public.check_beta_weekly_quota(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_beta BOOLEAN;
  v_beta_activated_at TIMESTAMPTZ;
  v_feedback_count INTEGER;
  v_bug_count INTEGER;
  v_total_contributions INTEGER;
  v_last_contribution TIMESTAMPTZ;
  v_days_since_last INTEGER;
  v_is_grace_period BOOLEAN := FALSE;
BEGIN
  -- Verify caller is the user themselves or an admin
  IF p_user_id != auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: cannot check quota for other users';
  END IF;

  SELECT is_beta_tester, 
         COALESCE(beta_expires_at - INTERVAL '90 days', created_at) 
  INTO v_is_beta, v_beta_activated_at
  FROM public.profiles WHERE id = p_user_id;
  
  IF NOT COALESCE(v_is_beta, false) THEN
    RETURN jsonb_build_object('is_beta', false, 'quota_met', false, 'contributions_14d', 0);
  END IF;

  -- Check grace period (first 14 days)
  IF v_beta_activated_at IS NOT NULL AND (NOW() - v_beta_activated_at) < INTERVAL '14 days' THEN
    v_is_grace_period := TRUE;
  END IF;

  -- Count feedback with comments >= 80 characters
  SELECT COUNT(*) INTO v_feedback_count
  FROM public.beta_feedback
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '14 days'
    AND (LENGTH(COALESCE(comment, '')) >= 80 OR LENGTH(COALESCE(suggestions, '')) >= 80);

  -- Count bug reports
  SELECT COUNT(*) INTO v_bug_count
  FROM public.beta_bug_reports
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '14 days';

  v_total_contributions := v_feedback_count + v_bug_count;

  SELECT MAX(last_date) INTO v_last_contribution FROM (
    SELECT MAX(created_at) as last_date FROM public.beta_feedback WHERE user_id = p_user_id
    UNION ALL
    SELECT MAX(created_at) as last_date FROM public.beta_bug_reports WHERE user_id = p_user_id
  ) sub;

  v_days_since_last := EXTRACT(DAY FROM NOW() - COALESCE(v_last_contribution, NOW() - INTERVAL '999 days'));

  -- Skip deactivation during grace period
  IF NOT v_is_grace_period AND (v_total_contributions < 4 OR v_bug_count < 1) AND v_days_since_last > 14 THEN
    UPDATE public.profiles 
    SET is_beta_tester = false, beta_plan_level = 'free', updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
      'is_beta', false, 
      'quota_met', false, 
      'contributions_14d', v_total_contributions,
      'feedback_count', v_feedback_count,
      'bug_report_count', v_bug_count,
      'days_since_last', v_days_since_last,
      'deactivated', true,
      'grace_period', false,
      'min_bugs_required', 1,
      'bugs_submitted', v_bug_count,
      'required', 4,
      'message', 'Acceso beta desactivado por inactividad. Necesitas al menos 4 contribuciones (incluyendo 1 bug report) cada 14 días.'
    );
  END IF;

  UPDATE public.profiles 
  SET beta_plan_level = 'pro_beta'
  WHERE id = p_user_id AND is_beta_tester = true AND beta_plan_level != 'pro_beta';

  RETURN jsonb_build_object(
    'is_beta', true, 
    'quota_met', v_is_grace_period OR (v_total_contributions >= 4 AND v_bug_count >= 1),
    'contributions_14d', v_total_contributions,
    'feedback_count', v_feedback_count,
    'bug_report_count', v_bug_count,
    'days_since_last', v_days_since_last,
    'required', 4,
    'min_bugs_required', 1,
    'bugs_submitted', v_bug_count,
    'grace_period', v_is_grace_period
  );
END;
$function$;
