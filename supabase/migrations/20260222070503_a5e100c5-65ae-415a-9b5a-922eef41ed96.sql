
-- =====================================================
-- CLEAN UP: Drop ALL beta-related triggers first, then recreate only the correct ones
-- =====================================================

-- Drop all possible duplicate triggers on beta_feedback
DROP TRIGGER IF EXISTS award_feedback_points_trigger ON public.beta_feedback;
DROP TRIGGER IF EXISTS award_points_on_feedback ON public.beta_feedback;

-- Drop all possible duplicate triggers on beta_bug_reports
DROP TRIGGER IF EXISTS award_bug_report_points_trigger ON public.beta_bug_reports;
DROP TRIGGER IF EXISTS award_points_on_bug_report ON public.beta_bug_reports;

-- Drop all possible duplicate triggers on profiles (beta-related)
DROP TRIGGER IF EXISTS init_beta_on_profile_update ON public.profiles;
DROP TRIGGER IF EXISTS init_beta_points_on_activation ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_beta_status_change ON public.profiles;
DROP TRIGGER IF EXISTS on_beta_tester_activated ON public.profiles;
DROP TRIGGER IF EXISTS generate_referral_on_beta ON public.profiles;
DROP TRIGGER IF EXISTS generate_referral_on_beta_activation ON public.profiles;
DROP TRIGGER IF EXISTS trigger_generate_beta_referral_code ON public.profiles;
DROP TRIGGER IF EXISTS check_beta_expiration_trigger ON public.profiles;
DROP TRIGGER IF EXISTS convert_referral_lead_on_profile ON public.profiles;

-- =====================================================
-- RECREATE: One trigger per action
-- =====================================================

-- 1. Points for feedback
CREATE TRIGGER award_feedback_points_trigger
  AFTER INSERT ON public.beta_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_for_feedback();

-- 2. Points for bug reports
CREATE TRIGGER award_bug_report_points_trigger
  AFTER INSERT ON public.beta_bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_for_bug_report();

-- 3. Init beta points + plan level on activation/deactivation
CREATE TRIGGER init_beta_points_on_activation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_init_beta_points();

-- 4. Generate referral code on beta activation
CREATE TRIGGER generate_referral_on_beta_activation
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_beta_referral_code();

-- 5. Check beta expiration
CREATE TRIGGER check_beta_expiration_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_beta_expiration();

-- 6. Convert referral leads on profile creation
CREATE TRIGGER convert_referral_lead_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.convert_referral_lead();

-- =====================================================
-- DROP orphan functions
-- =====================================================
DROP FUNCTION IF EXISTS public.trigger_award_points_on_feedback() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_award_points_on_bug_report() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_generate_referral_on_beta() CASCADE;
DROP FUNCTION IF EXISTS public.on_beta_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.initialize_beta_points() CASCADE;
DROP FUNCTION IF EXISTS public.generate_beta_referral_code_on_insert() CASCADE;
