
-- =============================================
-- CORRECCIONES DE SEGURIDAD RLS - AUDITORÍA
-- =============================================

-- 1. PROFILES - Agregar política DELETE para cumplimiento GDPR
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- 2. NET_WORTH_SNAPSHOTS - Agregar UPDATE y DELETE
CREATE POLICY "Users can update their own snapshots"
ON public.net_worth_snapshots
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snapshots"
ON public.net_worth_snapshots
FOR DELETE
USING (auth.uid() = user_id);

-- 3. EXPORT_LOGS - Agregar UPDATE y DELETE
CREATE POLICY "Users can update their own exports"
ON public.export_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exports"
ON public.export_logs
FOR DELETE
USING (auth.uid() = user_id);

-- 4. USER_ACHIEVEMENTS - Agregar DELETE
CREATE POLICY "Users can delete their own achievements"
ON public.user_achievements
FOR DELETE
USING (auth.uid() = user_id);

-- 5. USER_FINANCIAL_LEVEL - Agregar DELETE
CREATE POLICY "Users can delete their own level"
ON public.user_financial_level
FOR DELETE
USING (auth.uid() = user_id);

-- 6. USER_FINANCIAL_PROFILE - Agregar DELETE
CREATE POLICY "Users can delete their own financial profile"
ON public.user_financial_profile
FOR DELETE
USING (auth.uid() = user_id);

-- 7. PAY_YOURSELF_FIRST_SETTINGS - Agregar DELETE
CREATE POLICY "Users can delete their own pyf settings"
ON public.pay_yourself_first_settings
FOR DELETE
USING (auth.uid() = user_id);

-- 8. FINANCIAL_HABIT_LOGS - Agregar UPDATE
CREATE POLICY "Users can update their own habit logs"
ON public.financial_habit_logs
FOR UPDATE
USING (auth.uid() = user_id);

-- 9. PROJECT_CLIENTS - Agregar UPDATE
CREATE POLICY "Users can update their own project-client links"
ON public.project_clients
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM projects
  WHERE projects.id = project_clients.project_id
  AND projects.user_id = auth.uid()
));

-- 10. EXPENSE_TAGS - Agregar UPDATE
CREATE POLICY "Users can update their own expense tags"
ON public.expense_tags
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM expenses
  WHERE expenses.id = expense_tags.expense_id
  AND expenses.user_id = auth.uid()
));
