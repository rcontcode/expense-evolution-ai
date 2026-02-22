
-- ============================================
-- 1. Add testimonial columns to beta_feedback
-- ============================================
ALTER TABLE public.beta_feedback
  ADD COLUMN IF NOT EXISTS allow_as_testimonial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_name_override text,
  ADD COLUMN IF NOT EXISTS is_published_testimonial boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS testimonial_approved_by uuid,
  ADD COLUMN IF NOT EXISTS testimonial_approved_at timestamptz;

-- ============================================
-- 2. RLS policies for testimonials
-- ============================================

-- Admins can update feedback (to publish testimonials)
CREATE POLICY "Admins can update beta_feedback"
  ON public.beta_feedback
  FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Anyone can read published testimonials (for landing page)
CREATE POLICY "Anyone can read published testimonials"
  ON public.beta_feedback
  FOR SELECT
  USING (is_published_testimonial = true);

-- ============================================
-- 3. Recreate all 6 missing triggers
-- ============================================

-- Drop if exist to avoid conflicts
DROP TRIGGER IF EXISTS award_feedback_points_trigger ON public.beta_feedback;
DROP TRIGGER IF EXISTS award_bug_report_points_trigger ON public.beta_bug_reports;
DROP TRIGGER IF EXISTS init_beta_points_on_activation ON public.profiles;
DROP TRIGGER IF EXISTS generate_referral_on_beta_activation ON public.profiles;
DROP TRIGGER IF EXISTS check_beta_expiration_trigger ON public.profiles;
DROP TRIGGER IF EXISTS convert_referral_lead_on_profile ON public.profiles;

-- 3a. Award points on feedback insert
CREATE TRIGGER award_feedback_points_trigger
  AFTER INSERT ON public.beta_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_for_feedback();

-- 3b. Award points on bug report insert
CREATE TRIGGER award_bug_report_points_trigger
  AFTER INSERT ON public.beta_bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_for_bug_report();

-- 3c. Initialize beta points when user becomes beta tester
CREATE TRIGGER init_beta_points_on_activation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_init_beta_points();

-- 3d. Generate referral code when user becomes beta tester
CREATE TRIGGER generate_referral_on_beta_activation
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_beta_referral_code();

-- 3e. Check beta expiration on profile update
CREATE TRIGGER check_beta_expiration_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_beta_expiration();

-- 3f. Convert referral lead when new profile is created
CREATE TRIGGER convert_referral_lead_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.convert_referral_lead();
