-- Create table for beta tester points/scores
CREATE TABLE public.beta_tester_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  feedback_points INTEGER NOT NULL DEFAULT 0,
  bug_report_points INTEGER NOT NULL DEFAULT 0,
  referral_points INTEGER NOT NULL DEFAULT 0,
  feature_usage_points INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  reward_claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_points UNIQUE (user_id)
);

-- Create table for beta goals/missions
CREATE TABLE public.beta_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_key TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_es TEXT NOT NULL,
  description_en TEXT NOT NULL,
  points_reward INTEGER NOT NULL DEFAULT 10,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('one_time', 'repeatable', 'streak')),
  target_value INTEGER NOT NULL DEFAULT 1,
  icon TEXT NOT NULL DEFAULT '🎯',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for tracking user goal completions
CREATE TABLE public.beta_goal_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.beta_goals(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for reward redemptions
CREATE TABLE public.beta_reward_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('premium_1_year', 'pro_6_months', 'pro_1_year', 'custom')),
  points_spent INTEGER NOT NULL DEFAULT 0,
  tier_at_redemption TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'applied', 'rejected')),
  admin_notes TEXT,
  subscription_end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_tester_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_goal_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_reward_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS for beta_tester_points
CREATE POLICY "Users can view their own points" ON public.beta_tester_points
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own points" ON public.beta_tester_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own points" ON public.beta_tester_points
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS for beta_goals (viewable by all authenticated users)
CREATE POLICY "Goals viewable by authenticated users" ON public.beta_goals
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS for beta_goal_completions
CREATE POLICY "Users can view their own goal completions" ON public.beta_goal_completions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goal completions" ON public.beta_goal_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goal completions" ON public.beta_goal_completions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS for beta_reward_redemptions
CREATE POLICY "Users can view their own redemptions" ON public.beta_reward_redemptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can request redemptions" ON public.beta_reward_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default goals
INSERT INTO public.beta_goals (goal_key, name_es, name_en, description_es, description_en, points_reward, goal_type, target_value, icon, sort_order) VALUES
-- Feedback goals
('first_feedback', 'Primer Feedback', 'First Feedback', 'Envía tu primera evaluación de una sección', 'Submit your first section rating', 50, 'one_time', 1, '⭐', 1),
('feedback_5', 'Crítico Experto', 'Expert Critic', 'Envía 5 evaluaciones de diferentes secciones', 'Submit 5 ratings for different sections', 100, 'one_time', 5, '🏆', 2),
('feedback_10', 'Voz de Oro', 'Golden Voice', 'Envía 10 evaluaciones en total', 'Submit 10 total ratings', 200, 'one_time', 10, '👑', 3),
-- Bug report goals
('first_bug', 'Cazador de Bugs', 'Bug Hunter', 'Reporta tu primer bug o problema', 'Report your first bug or issue', 75, 'one_time', 1, '🐛', 4),
('bug_5', 'Depurador Pro', 'Pro Debugger', 'Reporta 5 bugs que nos ayuden a mejorar', 'Report 5 bugs that help us improve', 150, 'one_time', 5, '🔍', 5),
('critical_bug', 'Héroe del Sistema', 'System Hero', 'Reporta un bug crítico', 'Report a critical bug', 200, 'one_time', 1, '🦸', 6),
-- Referral goals
('first_referral', 'Embajador', 'Ambassador', 'Invita a tu primer amigo', 'Invite your first friend', 100, 'one_time', 1, '🤝', 7),
('referral_3', 'Red de Confianza', 'Trust Network', 'Invita a 3 amigos que se activen', 'Invite 3 friends who activate', 250, 'one_time', 3, '🌐', 8),
('referral_5', 'Influencer Financiero', 'Finance Influencer', 'Invita a 5 amigos activos', 'Invite 5 active friends', 500, 'one_time', 5, '🌟', 9),
-- Usage goals
('daily_login_7', 'Usuario Consistente', 'Consistent User', 'Usa la app 7 días seguidos', 'Use the app 7 days in a row', 150, 'streak', 7, '🔥', 10),
('daily_login_30', 'Usuario Dedicado', 'Dedicated User', 'Usa la app 30 días seguidos', 'Use the app 30 days in a row', 400, 'streak', 30, '💎', 11),
('explore_features', 'Explorador', 'Explorer', 'Usa 10 funcionalidades diferentes', 'Use 10 different features', 100, 'one_time', 10, '🗺️', 12),
-- Special goals
('detailed_feedback', 'Analista Detallado', 'Detailed Analyst', 'Envía un feedback con comentarios detallados (+100 caracteres)', 'Submit detailed feedback (+100 characters)', 75, 'one_time', 1, '📝', 13),
('screenshot_helper', 'Documentador Visual', 'Visual Documenter', 'Incluye capturas en 3 reportes', 'Include screenshots in 3 reports', 100, 'one_time', 3, '📸', 14);

-- Function to initialize beta points for a user
CREATE OR REPLACE FUNCTION public.initialize_beta_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.beta_tester_points (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create points record when user becomes beta tester
CREATE OR REPLACE FUNCTION public.on_beta_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_beta_tester = true AND (OLD.is_beta_tester IS NULL OR OLD.is_beta_tester = false) THEN
    INSERT INTO public.beta_tester_points (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_profile_beta_status_change
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.on_beta_status_change();

-- Function to award points and update tier
CREATE OR REPLACE FUNCTION public.award_beta_points(
  p_user_id UUID,
  p_points INTEGER,
  p_category TEXT DEFAULT 'feature_usage'
)
RETURNS public.beta_tester_points AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update streak
CREATE OR REPLACE FUNCTION public.update_beta_streak(p_user_id UUID)
RETURNS public.beta_tester_points AS $$
DECLARE
  v_result public.beta_tester_points;
  v_last_date DATE;
  v_current_streak INTEGER;
BEGIN
  SELECT last_activity_date, streak_days INTO v_last_date, v_current_streak
  FROM public.beta_tester_points
  WHERE user_id = p_user_id;

  IF v_last_date IS NULL OR v_last_date < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Streak broken, reset to 1
    UPDATE public.beta_tester_points
    SET streak_days = 1, last_activity_date = CURRENT_DATE, updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_result;
  ELSIF v_last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Continuing streak
    UPDATE public.beta_tester_points
    SET 
      streak_days = streak_days + 1,
      best_streak = GREATEST(best_streak, streak_days + 1),
      last_activity_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_result;
  ELSE
    -- Same day, just update activity
    UPDATE public.beta_tester_points
    SET last_activity_date = CURRENT_DATE, updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to claim reward
CREATE OR REPLACE FUNCTION public.claim_beta_reward(
  p_user_id UUID,
  p_reward_type TEXT
)
RETURNS public.beta_reward_redemptions AS $$
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

  -- Set required points based on reward
  v_required_points := CASE p_reward_type
    WHEN 'premium_1_year' THEN 1000
    WHEN 'pro_6_months' THEN 1500
    WHEN 'pro_1_year' THEN 2000
    ELSE 9999999
  END;

  -- Check if user qualifies
  IF v_points < v_required_points THEN
    RAISE EXCEPTION 'Insufficient points: % required, % available', v_required_points, v_points;
  END IF;

  -- Check if already claimed
  IF EXISTS (
    SELECT 1 FROM public.beta_reward_redemptions 
    WHERE user_id = p_user_id AND status IN ('pending', 'approved', 'applied')
  ) THEN
    RAISE EXCEPTION 'Already has a pending or active reward';
  END IF;

  -- Create redemption request
  INSERT INTO public.beta_reward_redemptions (
    user_id, reward_type, points_spent, tier_at_redemption
  ) VALUES (
    p_user_id, p_reward_type, v_required_points, v_tier
  )
  RETURNING * INTO v_result;

  -- Mark as claimed
  UPDATE public.beta_tester_points
  SET reward_claimed = true, reward_claimed_at = now()
  WHERE user_id = p_user_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;