
-- Remove the dangerous UPDATE policy that allows users to self-upgrade their subscription
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;

-- Add admin-only UPDATE policy
CREATE POLICY "Only admins can update subscriptions"
ON public.user_subscriptions FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Also fix usage_tracking: remove user UPDATE policy to prevent quota reset
DROP POLICY IF EXISTS "Users can update their own usage" ON public.usage_tracking;
