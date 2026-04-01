
-- 1. Fix user_subscriptions: restrict INSERT to only free plan
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can insert their own free subscription" ON public.user_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND plan_type = 'free');

-- 2. Add deny policies for email_send_log (block non-service-role reads)
CREATE POLICY "Block non-service users from reading send log" ON public.email_send_log
  FOR SELECT TO authenticated
  USING (false);

-- 3. Add deny policies for suppressed_emails
CREATE POLICY "Block non-service users from reading suppressed emails" ON public.suppressed_emails
  FOR SELECT TO authenticated
  USING (false);

-- 4. Remove user UPDATE policy on beta_tester_points (prevent self-awarding)
DROP POLICY IF EXISTS "Users can update their own points" ON public.beta_tester_points;

-- 5. Remove user INSERT/UPDATE on user_achievements (prevent self-granting)
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can update their own achievements" ON public.user_achievements;

-- 6. Create service-role only INSERT/UPDATE for user_achievements
CREATE POLICY "Service role can insert achievements" ON public.user_achievements
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update achievements" ON public.user_achievements
  FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);
