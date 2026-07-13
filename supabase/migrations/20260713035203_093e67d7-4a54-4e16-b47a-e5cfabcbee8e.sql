
-- 1) beta_feedback: replace public policy with a safe view
DROP POLICY IF EXISTS "Anyone can read published testimonials" ON public.beta_feedback;

CREATE OR REPLACE VIEW public.published_testimonials
WITH (security_invoker = true) AS
SELECT
  bf.id,
  bf.rating,
  bf.comment,
  bf.suggestions,
  bf.created_at,
  COALESCE(bf.display_name_override, p.full_name, 'Early User') AS display_name
FROM public.beta_feedback bf
LEFT JOIN public.profiles p ON p.id = bf.user_id
WHERE bf.is_published_testimonial = true;

-- The view needs a policy path: since security_invoker=true, underlying table
-- RLS applies. Add a targeted SELECT policy allowing anyone to read only the
-- published rows (no user_id column is projected by the view).
CREATE POLICY "Public can read published testimonial rows"
ON public.beta_feedback
FOR SELECT
TO anon, authenticated
USING (is_published_testimonial = true);

-- Wait: this re-adds broad access to underlying table. Instead, drop that
-- and use a SECURITY DEFINER view.
DROP POLICY IF EXISTS "Public can read published testimonial rows" ON public.beta_feedback;

CREATE OR REPLACE VIEW public.published_testimonials AS
SELECT
  bf.id,
  bf.rating,
  bf.comment,
  bf.suggestions,
  bf.created_at,
  COALESCE(bf.display_name_override, p.full_name, 'Early User') AS display_name
FROM public.beta_feedback bf
LEFT JOIN public.profiles p ON p.id = bf.user_id
WHERE bf.is_published_testimonial = true;

GRANT SELECT ON public.published_testimonials TO anon, authenticated;

-- Public aggregate stats function for the landing "social proof"
CREATE OR REPLACE FUNCTION public.get_public_feedback_stats()
RETURNS TABLE(avg_rating numeric, ratings_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(rating), 0)::numeric AS avg_rating,
         COUNT(*)::bigint AS ratings_count
  FROM public.beta_feedback
  WHERE is_published_testimonial = true AND rating IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_public_feedback_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_feedback_stats() TO anon, authenticated;

-- 2) referral_leads: remove permissive INSERT policies; inserts go through
-- capture_referral_lead (SECURITY DEFINER) which bypasses RLS.
DROP POLICY IF EXISTS "Authenticated users can insert referral leads" ON public.referral_leads;
DROP POLICY IF EXISTS "Insert through function only" ON public.referral_leads;

-- 3) Remove no-op service_role policies (service_role bypasses RLS)
DROP POLICY IF EXISTS "Service role only for rate limits" ON public.webhook_rate_limits;
DROP POLICY IF EXISTS "Service role can insert achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Service role can update achievements" ON public.user_achievements;

-- 4) email-assets bucket: drop listing policy (public URLs still work via CDN)
DROP POLICY IF EXISTS "Public read access for email assets" ON storage.objects;

-- 5) Revoke EXECUTE from anon/authenticated on trigger-only and internal
-- helper functions. Keep only functions that are legitimately called via RPC
-- from the client or are used inside RLS policies.
DO $$
DECLARE
  fn text;
  trigger_and_internal text[] := ARRAY[
    'handle_new_user_subscription()',
    'handle_new_user()',
    'convert_referral_lead()',
    'trigger_init_beta_points()',
    'create_beta_referral_code()',
    'check_beta_expiration()',
    'update_updated_at_column()',
    'ensure_single_primary_entity()',
    'generate_beta_referral_code()',
    'award_points_for_feedback()',
    'award_points_for_bug_report()',
    'email_queue_wake()',
    'email_queue_dispatch()',
    'read_email_batch(text, integer, integer)',
    'delete_email(text, bigint)',
    'enqueue_email(text, jsonb)',
    'move_to_dlq(text, text, bigint, jsonb)',
    'get_user_beta_stats(uuid)',
    'get_or_create_monthly_usage(uuid)',
    'validate_beta_invitation_code(text)',
    'use_beta_invitation_code(text, uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY trigger_and_internal LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'Skipping missing function %', fn;
    END;
  END LOOP;
END $$;
