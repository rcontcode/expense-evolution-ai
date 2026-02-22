
-- Drop and recreate only the missing ones (feedback and bug report triggers)
-- The profile triggers already exist

DROP TRIGGER IF EXISTS award_points_on_feedback ON public.beta_feedback;
CREATE TRIGGER award_points_on_feedback
  AFTER INSERT ON public.beta_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_for_feedback();

DROP TRIGGER IF EXISTS award_points_on_bug_report ON public.beta_bug_reports;
CREATE TRIGGER award_points_on_bug_report
  AFTER INSERT ON public.beta_bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_for_bug_report();

DROP TRIGGER IF EXISTS generate_referral_on_beta_activation ON public.profiles;
CREATE TRIGGER generate_referral_on_beta_activation
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.is_beta_tester = true AND (OLD.is_beta_tester IS NULL OR OLD.is_beta_tester = false))
  EXECUTE FUNCTION public.generate_beta_referral_code();

DROP TRIGGER IF EXISTS init_beta_points_on_activation ON public.profiles;
CREATE TRIGGER init_beta_points_on_activation
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.is_beta_tester = true AND (OLD.is_beta_tester IS NULL OR OLD.is_beta_tester = false))
  EXECUTE FUNCTION public.on_beta_status_change();
