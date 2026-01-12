-- Add missing RLS policies for beta_code_uses table
-- INSERT: Only allow through the use_beta_invitation_code function (SECURITY DEFINER)
-- Users should NOT be able to directly insert/update/delete code uses

-- Policy to prevent direct INSERT (inserts happen via SECURITY DEFINER function)
CREATE POLICY "Prevent direct inserts to beta_code_uses"
ON public.beta_code_uses
FOR INSERT
WITH CHECK (false);

-- Policy to prevent UPDATE (code uses should never be modified)
CREATE POLICY "Prevent updates to beta_code_uses"
ON public.beta_code_uses
FOR UPDATE
USING (false);

-- Policy to prevent DELETE (code uses should never be deleted by users)
CREATE POLICY "Prevent deletes to beta_code_uses"
ON public.beta_code_uses
FOR DELETE
USING (false);