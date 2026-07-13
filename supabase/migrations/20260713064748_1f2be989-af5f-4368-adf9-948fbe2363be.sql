
-- Lock down SECURITY DEFINER functions: revoke broad EXECUTE, then re-grant only where needed.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

-- Anon-callable public RPCs (pre-auth flows: quiz, referral capture, landing testimonials)
GRANT EXECUTE ON FUNCTION public.validate_any_beta_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_beta_invitation_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.capture_referral_lead(text, text, text, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_feedback_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_published_testimonials() TO anon, authenticated;

-- Authenticated-only RPCs (client calls with in-function auth.uid() checks)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_beta_weekly_quota(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_beta_streak(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_beta_reward(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_beta_referral_code(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_beta_invitation_code(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_usage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_voice_usage(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_achievement(text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ecosystem_leaderboard(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_beta_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_monthly_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_use_ai(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_ai_credits_used(uuid) TO authenticated;

-- Admin-only mutations (each enforces is_admin() in-function): keep callable by authenticated
GRANT EXECUTE ON FUNCTION public.activate_beta_tester(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_beta_access(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.extend_beta_access(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_beta_reward(uuid) TO authenticated;
