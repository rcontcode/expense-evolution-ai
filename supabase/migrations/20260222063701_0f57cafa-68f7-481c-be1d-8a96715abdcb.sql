
-- 1. Add beta_plan_level to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS beta_plan_level TEXT DEFAULT 'free';

-- 2. Insert pro_beta plan configuration (Pro features with reduced limits)
INSERT INTO public.plan_configurations (
  plan_type, display_name, description, sort_order,
  expenses_per_month, incomes_per_month, ocr_scans_per_month,
  clients_limit, projects_limit,
  contract_analyses_per_month, bank_analyses_per_month,
  voice_requests_per_month, voice_minutes_per_month,
  mileage_enabled, gamification_enabled, net_worth_enabled,
  tax_calendar_enabled, tags_unlimited, export_excel_enabled,
  fire_calculator_enabled, mentorship_components, voice_assistant_enabled,
  tax_optimizer_enabled, rrsp_tfsa_optimizer_enabled, t2125_export_enabled,
  is_active
) VALUES (
  'pro_beta', 'Pro Beta', 'Acceso Pro con límites reducidos para beta testers activos. Voz IA: 15 min/mes, OCR: 20/mes.',
  3,
  -1, -1, 20,   -- unlimited expenses/incomes, 20 OCR
  -1, -1,       -- unlimited clients/projects
  -1, -1,       -- unlimited contract/bank analyses
  -1, 15,       -- unlimited voice requests, 15 min voice
  true, true, true,
  true, true, true,
  true, 8, true,
  true, true, true,
  true
);

-- 3. Function to check beta weekly quota (2 contributions in 14 days)
CREATE OR REPLACE FUNCTION public.check_beta_weekly_quota(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_is_beta BOOLEAN;
  v_feedback_count INTEGER;
  v_bug_count INTEGER;
  v_total_contributions INTEGER;
  v_last_contribution TIMESTAMPTZ;
  v_days_since_last INTEGER;
BEGIN
  -- Check if user is beta tester
  SELECT is_beta_tester INTO v_is_beta
  FROM public.profiles WHERE id = p_user_id;
  
  IF NOT COALESCE(v_is_beta, false) THEN
    RETURN jsonb_build_object('is_beta', false, 'quota_met', false, 'contributions_14d', 0);
  END IF;

  -- Count feedback in last 14 days (only quality: comment >= 50 chars)
  SELECT COUNT(*) INTO v_feedback_count
  FROM public.beta_feedback
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '14 days'
    AND (LENGTH(COALESCE(comment, '')) >= 50 OR LENGTH(COALESCE(suggestions, '')) >= 50);

  -- Count bug reports in last 14 days
  SELECT COUNT(*) INTO v_bug_count
  FROM public.beta_bug_reports
  WHERE user_id = p_user_id
    AND created_at >= NOW() - INTERVAL '14 days';

  v_total_contributions := v_feedback_count + v_bug_count;

  -- Get last contribution date
  SELECT MAX(last_date) INTO v_last_contribution FROM (
    SELECT MAX(created_at) as last_date FROM public.beta_feedback WHERE user_id = p_user_id
    UNION ALL
    SELECT MAX(created_at) as last_date FROM public.beta_bug_reports WHERE user_id = p_user_id
  ) sub;

  v_days_since_last := EXTRACT(DAY FROM NOW() - COALESCE(v_last_contribution, NOW() - INTERVAL '999 days'));

  -- If no contributions in 14 days, deactivate beta
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

  -- Update beta_plan_level to pro_beta if active
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
$$;

-- 4. Function to apply beta reward (admin approves -> activates subscription)
CREATE OR REPLACE FUNCTION public.apply_beta_reward(p_redemption_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_redemption RECORD;
  v_plan_type TEXT;
  v_duration_months INTEGER;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can apply rewards';
  END IF;

  -- Get redemption details
  SELECT * INTO v_redemption
  FROM public.beta_reward_redemptions
  WHERE id = p_redemption_id AND status = 'pending';

  IF v_redemption IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Redemption not found or not pending');
  END IF;

  -- Determine plan and duration based on reward type
  CASE v_redemption.reward_type
    WHEN 'premium_1_year' THEN
      v_plan_type := 'premium';
      v_duration_months := 12;
    WHEN 'pro_6_months' THEN
      v_plan_type := 'pro';
      v_duration_months := 6;
    WHEN 'pro_1_year' THEN
      v_plan_type := 'pro';
      v_duration_months := 12;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Unknown reward type');
  END CASE;

  v_end_date := NOW() + (v_duration_months || ' months')::INTERVAL;

  -- Update or insert user subscription
  INSERT INTO public.user_subscriptions (user_id, plan_type, is_active, expires_at, billing_period)
  VALUES (v_redemption.user_id, v_plan_type, true, v_end_date, 'annual')
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    plan_type = v_plan_type,
    is_active = true,
    expires_at = v_end_date,
    updated_at = NOW();

  -- Update redemption status
  UPDATE public.beta_reward_redemptions
  SET status = 'applied', 
      subscription_end_date = v_end_date::TEXT,
      admin_notes = COALESCE(admin_notes, '') || ' | Aplicado automáticamente el ' || NOW()::TEXT,
      updated_at = NOW()
  WHERE id = p_redemption_id;

  RETURN jsonb_build_object(
    'success', true,
    'plan_type', v_plan_type,
    'duration_months', v_duration_months,
    'end_date', v_end_date,
    'user_id', v_redemption.user_id
  );
END;
$$;

-- 5. Update claim_beta_reward to use new point thresholds (1000, 2000, 3000)
CREATE OR REPLACE FUNCTION public.claim_beta_reward(p_user_id UUID, p_reward_type TEXT)
RETURNS beta_reward_redemptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_points INTEGER;
  v_tier TEXT;
  v_required_points INTEGER;
  v_result public.beta_reward_redemptions;
BEGIN
  -- Get current points and tier
  SELECT total_points, tier INTO v_points, v_tier
  FROM public.beta_tester_points
  WHERE user_id = p_user_id;

  -- Updated point thresholds
  v_required_points := CASE p_reward_type
    WHEN 'premium_1_year' THEN 1000
    WHEN 'pro_6_months' THEN 2000
    WHEN 'pro_1_year' THEN 3000
    ELSE 9999999
  END;

  IF v_points < v_required_points THEN
    RAISE EXCEPTION 'Puntos insuficientes: % requeridos, % disponibles', v_required_points, v_points;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.beta_reward_redemptions 
    WHERE user_id = p_user_id AND status IN ('pending', 'approved', 'applied')
  ) THEN
    RAISE EXCEPTION 'Ya tienes una recompensa pendiente o activa';
  END IF;

  INSERT INTO public.beta_reward_redemptions (
    user_id, reward_type, points_spent, tier_at_redemption
  ) VALUES (
    p_user_id, p_reward_type, v_required_points, v_tier
  )
  RETURNING * INTO v_result;

  UPDATE public.beta_tester_points
  SET reward_claimed = true, reward_claimed_at = now()
  WHERE user_id = p_user_id;

  RETURN v_result;
END;
$$;

-- 6. Set beta_plan_level = 'pro_beta' for existing active beta testers
UPDATE public.profiles 
SET beta_plan_level = 'pro_beta' 
WHERE is_beta_tester = true;
