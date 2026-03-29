
-- Step 1: Create savings_contributions table (phantom table fix)
CREATE TABLE public.savings_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  notes TEXT,
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own contributions"
  ON public.savings_contributions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Step 2: Add voice_requests_count column to usage_tracking
ALTER TABLE public.usage_tracking
  ADD COLUMN IF NOT EXISTS voice_requests_count INTEGER NOT NULL DEFAULT 0;

-- Step 3: Fix increment_usage function (voice case now has the column)
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_usage_type text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_period DATE;
BEGIN
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify another user''s usage';
  END IF;

  v_current_period := date_trunc('month', now())::date;
  
  INSERT INTO public.usage_tracking (user_id, period_start)
  VALUES (p_user_id, v_current_period)
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
  IF p_usage_type = 'expense' THEN
    UPDATE public.usage_tracking 
    SET expenses_count = expenses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'income' THEN
    UPDATE public.usage_tracking 
    SET incomes_count = incomes_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'ocr' THEN
    UPDATE public.usage_tracking 
    SET ocr_scans_count = ocr_scans_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'contract' THEN
    UPDATE public.usage_tracking 
    SET contract_analyses_count = contract_analyses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'bank' THEN
    UPDATE public.usage_tracking 
    SET bank_analyses_count = bank_analyses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'voice' THEN
    UPDATE public.usage_tracking 
    SET voice_requests_count = voice_requests_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  END IF;
END;
$function$;

-- Step 4: Remove redundant exchange_rates policy
DROP POLICY IF EXISTS "Authenticated users can view exchange rates" ON public.exchange_rates;
