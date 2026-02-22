
-- ========================================
-- Fix: Create all missing triggers for beta system
-- ========================================

-- 1. Trigger function to award points on feedback insertion
CREATE OR REPLACE FUNCTION public.trigger_award_points_on_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points integer;
BEGIN
  -- Base points: 25 for rating, +25 if comment has 50+ chars
  v_points := 25;
  IF NEW.comment IS NOT NULL AND length(trim(NEW.comment)) >= 50 THEN
    v_points := v_points + 25;
  END IF;
  
  PERFORM internal_award_beta_points(NEW.user_id, v_points, 'feedback');
  RETURN NEW;
END;
$$;

-- 2. Trigger function to award points on bug report insertion
CREATE OR REPLACE FUNCTION public.trigger_award_points_on_bug_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_points integer;
BEGIN
  -- Points based on severity
  v_points := CASE NEW.severity
    WHEN 'critical' THEN 150
    WHEN 'high' THEN 100
    WHEN 'medium' THEN 75
    ELSE 25
  END;
  
  -- Bonus if description is detailed (100+ chars)
  IF NEW.description IS NOT NULL AND length(trim(NEW.description)) >= 100 THEN
    v_points := v_points + 25;
  END IF;
  
  PERFORM internal_award_beta_points(NEW.user_id, v_points, 'bug_report');
  RETURN NEW;
END;
$$;

-- 3. Trigger function to initialize beta points when beta_tester is activated
CREATE OR REPLACE FUNCTION public.trigger_init_beta_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_beta_tester = true AND (OLD.is_beta_tester IS NULL OR OLD.is_beta_tester = false) THEN
    -- Initialize points record if not exists
    INSERT INTO beta_tester_points (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Set beta_plan_level to pro_beta
    NEW.beta_plan_level := 'pro_beta';
  END IF;
  
  -- If beta is deactivated, reset plan level
  IF NEW.is_beta_tester = false AND OLD.is_beta_tester = true THEN
    NEW.beta_plan_level := 'free';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Trigger function to generate referral code on beta activation
CREATE OR REPLACE FUNCTION public.trigger_generate_referral_on_beta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_beta_tester = true AND (OLD.is_beta_tester IS NULL OR OLD.is_beta_tester = false) THEN
    INSERT INTO beta_referral_codes (user_id, code)
    VALUES (NEW.id, 'BETA-' || substr(md5(NEW.id::text || now()::text), 1, 8))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Now create the actual triggers

-- Award points on feedback
DROP TRIGGER IF EXISTS award_points_on_feedback ON beta_feedback;
CREATE TRIGGER award_points_on_feedback
  AFTER INSERT ON beta_feedback
  FOR EACH ROW
  EXECUTE FUNCTION trigger_award_points_on_feedback();

-- Award points on bug report
DROP TRIGGER IF EXISTS award_points_on_bug_report ON beta_bug_reports;
CREATE TRIGGER award_points_on_bug_report
  AFTER INSERT ON beta_bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION trigger_award_points_on_bug_report();

-- Init beta points and set plan level on profile update
DROP TRIGGER IF EXISTS init_beta_on_profile_update ON profiles;
CREATE TRIGGER init_beta_on_profile_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.is_beta_tester IS DISTINCT FROM NEW.is_beta_tester)
  EXECUTE FUNCTION trigger_init_beta_points();

-- Generate referral code on beta activation
DROP TRIGGER IF EXISTS generate_referral_on_beta ON profiles;
CREATE TRIGGER generate_referral_on_beta
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.is_beta_tester = true AND (OLD.is_beta_tester IS NULL OR OLD.is_beta_tester = false))
  EXECUTE FUNCTION trigger_generate_referral_on_beta();

-- 5. Admin RLS policy for beta_reward_redemptions (admin needs to view/update ALL redemptions)
CREATE POLICY "Admins can view all redemptions"
  ON beta_reward_redemptions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update redemptions"
  ON beta_reward_redemptions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::user_role));
