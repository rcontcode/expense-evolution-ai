CREATE POLICY "Admins can update quiz leads"
ON public.quiz_leads
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));