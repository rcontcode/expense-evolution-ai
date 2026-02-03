
-- =====================================================
-- FIX: Remove exploitable award_beta_points RPC
-- Replace with automatic triggers for point awarding
-- =====================================================

-- Step 1: Revoke public access to the vulnerable function
REVOKE EXECUTE ON FUNCTION public.award_beta_points FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.award_beta_points FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_beta_points FROM public;

-- Step 2: Create internal function (not callable as RPC by users)
CREATE OR REPLACE FUNCTION public.internal_award_beta_points(
  p_user_id UUID,
  p_points INTEGER,
  p_category TEXT DEFAULT 'feature_usage'
)
RETURNS public.beta_tester_points
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result public.beta_tester_points;
  v_new_total INTEGER;
  v_new_tier TEXT;
BEGIN
  -- Ensure user has a points record
  INSERT INTO public.beta_tester_points (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update points based on category
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

  -- Calculate new tier
  v_new_tier := CASE
    WHEN v_new_total >= 2000 THEN 'diamond'
    WHEN v_new_total >= 1000 THEN 'platinum'
    WHEN v_new_total >= 500 THEN 'gold'
    WHEN v_new_total >= 200 THEN 'silver'
    ELSE 'bronze'
  END;

  -- Update tier
  UPDATE public.beta_tester_points
  SET tier = v_new_tier
  WHERE user_id = p_user_id
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

-- Step 3: Create trigger function for feedback points
CREATE OR REPLACE FUNCTION public.award_points_for_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INTEGER := 25;
  v_has_detail BOOLEAN;
BEGIN
  -- Check if feedback has detailed comments (>100 chars)
  v_has_detail := (LENGTH(COALESCE(NEW.comment, '')) > 100) OR 
                  (LENGTH(COALESCE(NEW.suggestions, '')) > 100);
  
  -- Bonus for detailed feedback
  IF v_has_detail THEN
    v_points := 50;
  END IF;
  
  -- Award points using internal function
  PERFORM public.internal_award_beta_points(NEW.user_id, v_points, 'feedback');
  
  RETURN NEW;
END;
$$;

-- Step 4: Create trigger function for bug report points
CREATE OR REPLACE FUNCTION public.award_points_for_bug_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points INTEGER;
BEGIN
  -- Points based on severity
  v_points := CASE NEW.severity
    WHEN 'low' THEN 25
    WHEN 'medium' THEN 50
    WHEN 'high' THEN 75
    WHEN 'critical' THEN 150
    ELSE 50
  END;
  
  -- Bonus for including screenshot
  IF NEW.screenshot_url IS NOT NULL AND NEW.screenshot_url != '' THEN
    v_points := v_points + 25;
  END IF;
  
  -- Award points using internal function
  PERFORM public.internal_award_beta_points(NEW.user_id, v_points, 'bug_report');
  
  RETURN NEW;
END;
$$;

-- Step 5: Create the triggers
DROP TRIGGER IF EXISTS award_feedback_points_trigger ON public.beta_feedback;
CREATE TRIGGER award_feedback_points_trigger
  AFTER INSERT ON public.beta_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_for_feedback();

DROP TRIGGER IF EXISTS award_bug_report_points_trigger ON public.beta_bug_reports;
CREATE TRIGGER award_bug_report_points_trigger
  AFTER INSERT ON public.beta_bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_for_bug_report();

-- Step 6: Drop the vulnerable public function
DROP FUNCTION IF EXISTS public.award_beta_points(UUID, INTEGER, TEXT);
