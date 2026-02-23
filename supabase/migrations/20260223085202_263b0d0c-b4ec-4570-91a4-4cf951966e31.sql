
-- Fix activate_beta_tester: add admin-only check
CREATE OR REPLACE FUNCTION public.activate_beta_tester(p_user_id uuid, p_days integer DEFAULT 90)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only admins can activate beta for any user
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: only admins can activate beta testers';
  END IF;

  UPDATE public.profiles
  SET 
    is_beta_tester = true,
    beta_expires_at = NOW() + (p_days || ' days')::INTERVAL
  WHERE id = p_user_id;
END;
$function$;

-- Fix check_beta_weekly_quota: ensure caller can only check own quota or admin
CREATE OR REPLACE FUNCTION public.check_beta_weekly_quota(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_beta BOOLEAN;
  v_feedback_count INTEGER;
  v_bug_count INTEGER;
  v_total_contributions INTEGER;
  v_last_contribution TIMESTAMPTZ;
  v_days_since_last INTEGER;
BEGIN
  -- Verify caller is the user themselves or an admin
  IF p_user_id != auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: cannot check quota for other users';
  END IF;

  SELECT is_beta_tester INTO v_is_beta
  FROM public.profiles WHERE id = p_user_id;
  
  IF NOT COALESCE(v_is_beta, false) THEN
    RETURN jsonb_build_object('is_beta', false, 'quota_met', false, 'contributions_14d', 0);
  END IF;

  SELECT COUNT(*) INTO v_feedback_count
  FROM public.beta_feedback
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '14 days'
    AND (LENGTH(COALESCE(comment, '')) >= 50 OR LENGTH(COALESCE(suggestions, '')) >= 50);

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

  IF v_total_contributions < 2 AND v_days_since_last > 14 THEN
    UPDATE public.profiles 
    SET is_beta_tester = false, beta_plan_level = 'free', updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
      'is_beta', false, 
      'quota_met', false, 
      'contributions_14d', v_total_contributions,
      'days_since_last', v_days_since_last,
      'deactivated', true,
      'message', 'Acceso beta desactivado por inactividad. Necesitas al menos 2 contribuciones cada 14 días.'
    );
  END IF;

  UPDATE public.profiles 
  SET beta_plan_level = 'pro_beta'
  WHERE id = p_user_id AND is_beta_tester = true AND beta_plan_level != 'pro_beta';

  RETURN jsonb_build_object(
    'is_beta', true, 
    'quota_met', v_total_contributions >= 2,
    'contributions_14d', v_total_contributions,
    'feedback_count', v_feedback_count,
    'bug_report_count', v_bug_count,
    'days_since_last', v_days_since_last,
    'required', 2
  );
END;
$function$;

-- Fix internal_award_beta_points: restrict to self or admin
CREATE OR REPLACE FUNCTION public.internal_award_beta_points(p_user_id uuid, p_points integer, p_category text DEFAULT 'feature_usage'::text)
 RETURNS beta_tester_points
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result public.beta_tester_points;
  v_new_total INTEGER;
  v_new_tier TEXT;
BEGIN
  -- Allow only: self-awarding, admin, or internal trigger calls (auth.uid() is null in triggers)
  IF auth.uid() IS NOT NULL AND p_user_id != auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: cannot award points for other users';
  END IF;

  INSERT INTO public.beta_tester_points (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.beta_tester_points
  SET 
    total_points = total_points + p_points,
    feedback_points = CASE WHEN p_category = 'feedback' THEN feedback_points + p_points ELSE feedback_points END,
    bug_report_points = CASE WHEN p_category = 'bug_report' THEN bug_report_points + p_points ELSE bug_report_points END,
    referral_points = CASE WHEN p_category = 'referral' THEN referral_points + p_points ELSE referral_points END,
    feature_usage_points = CASE WHEN p_category = 'feature_usage' THEN feature_usage_points + p_points ELSE feature_usage_points END,
    last_activity_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING total_points INTO v_new_total;

  v_new_tier := CASE
    WHEN v_new_total >= 2000 THEN 'diamond'
    WHEN v_new_total >= 1000 THEN 'platinum'
    WHEN v_new_total >= 500 THEN 'gold'
    WHEN v_new_total >= 200 THEN 'silver'
    ELSE 'bronze'
  END;

  UPDATE public.beta_tester_points
  SET tier = v_new_tier
  WHERE user_id = p_user_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$function$;

-- Fix update_beta_streak: restrict to self or admin
CREATE OR REPLACE FUNCTION public.update_beta_streak(p_user_id uuid)
 RETURNS beta_tester_points
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result public.beta_tester_points;
  v_last_date DATE;
  v_current_streak INTEGER;
BEGIN
  -- Verify caller is the user themselves or an admin
  IF p_user_id != auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: cannot update streak for other users';
  END IF;

  SELECT last_activity_date, streak_days INTO v_last_date, v_current_streak
  FROM public.beta_tester_points
  WHERE user_id = p_user_id;

  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE public.beta_tester_points
    SET streak_days = 1, last_activity_date = CURRENT_DATE, updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_result;
  ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    UPDATE public.beta_tester_points
    SET 
      streak_days = streak_days + 1,
      best_streak = GREATEST(best_streak, streak_days + 1),
      last_activity_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_result;
  ELSE
    UPDATE public.beta_tester_points
    SET last_activity_date = CURRENT_DATE, updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$function$;
