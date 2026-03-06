
CREATE OR REPLACE FUNCTION public.claim_beta_reward(p_user_id uuid, p_reward_type text)
 RETURNS beta_reward_redemptions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_points INTEGER;
  v_tier TEXT;
  v_required_points INTEGER;
  v_result public.beta_reward_redemptions;
BEGIN
  -- Verify caller identity
  IF p_user_id != auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: cannot claim reward for another user';
  END IF;

  SELECT total_points, tier INTO v_points, v_tier
  FROM public.beta_tester_points
  WHERE user_id = p_user_id;

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
$function$;
