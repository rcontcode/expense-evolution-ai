-- Create enum for plan types
CREATE TYPE public.plan_type AS ENUM ('free', 'premium', 'pro');

-- Create enum for billing period
CREATE TYPE public.billing_period AS ENUM ('monthly', 'annual');

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type public.plan_type NOT NULL DEFAULT 'free',
  billing_period public.billing_period DEFAULT 'monthly',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create usage tracking table for monthly limits
CREATE TABLE public.usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  expenses_count INTEGER NOT NULL DEFAULT 0,
  incomes_count INTEGER NOT NULL DEFAULT 0,
  ocr_scans_count INTEGER NOT NULL DEFAULT 0,
  contract_analyses_count INTEGER NOT NULL DEFAULT 0,
  bank_analyses_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_start)
);

-- Enable RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage"
ON public.usage_tracking
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
ON public.usage_tracking
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
ON public.usage_tracking
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create trigger to auto-create subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- Function to get or create current month usage
CREATE OR REPLACE FUNCTION public.get_or_create_monthly_usage(p_user_id UUID)
RETURNS public.usage_tracking
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage public.usage_tracking;
  v_current_period DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  SELECT * INTO v_usage
  FROM public.usage_tracking
  WHERE user_id = p_user_id AND period_start = v_current_period;
  
  IF v_usage IS NULL THEN
    INSERT INTO public.usage_tracking (user_id, period_start)
    VALUES (p_user_id, v_current_period)
    RETURNING * INTO v_usage;
  END IF;
  
  RETURN v_usage;
END;
$$;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID, p_usage_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_period DATE := date_trunc('month', CURRENT_DATE)::date;
BEGIN
  INSERT INTO public.usage_tracking (user_id, period_start)
  VALUES (p_user_id, v_current_period)
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
  IF p_usage_type = 'expense' THEN
    UPDATE public.usage_tracking SET expenses_count = expenses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'income' THEN
    UPDATE public.usage_tracking SET incomes_count = incomes_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'ocr' THEN
    UPDATE public.usage_tracking SET ocr_scans_count = ocr_scans_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'contract' THEN
    UPDATE public.usage_tracking SET contract_analyses_count = contract_analyses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  ELSIF p_usage_type = 'bank' THEN
    UPDATE public.usage_tracking SET bank_analyses_count = bank_analyses_count + 1, updated_at = now()
    WHERE user_id = p_user_id AND period_start = v_current_period;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();