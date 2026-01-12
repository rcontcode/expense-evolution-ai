-- Harden quiz_leads RLS: prevent authenticated users from reading all leads
-- and avoid an always-true INSERT policy.

ALTER TABLE public.quiz_leads ENABLE ROW LEVEL SECURITY;

-- Replace overly-permissive SELECT policy
DROP POLICY IF EXISTS "Admins can view quiz leads" ON public.quiz_leads;
CREATE POLICY "Admins can view quiz leads"
ON public.quiz_leads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::public.user_role));

-- Replace always-true INSERT policy (public lead capture remains allowed)
DROP POLICY IF EXISTS "Anyone can submit quiz leads" ON public.quiz_leads;
CREATE POLICY "Anyone can submit quiz leads"
ON public.quiz_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL AND btrim(name) <> ''
  AND email IS NOT NULL AND btrim(email) <> ''
);
