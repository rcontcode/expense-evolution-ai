
DROP POLICY IF EXISTS "Referrers can view own leads limited" ON public.referral_leads;

CREATE OR REPLACE FUNCTION public.get_my_referral_leads()
RETURNS TABLE(
  id uuid,
  name_initial text,
  created_at timestamptz,
  converted_at timestamptz,
  marketing_consent boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    rl.id,
    COALESCE(LEFT(rl.name, 1), '?') AS name_initial,
    rl.created_at,
    rl.converted_at,
    rl.marketing_consent
  FROM public.referral_leads rl
  WHERE rl.referrer_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_referral_leads() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_referral_leads() TO authenticated;
