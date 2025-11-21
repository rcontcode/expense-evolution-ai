-- ============================================
-- SPRINT 1: Database Foundation
-- ============================================

-- 1. Create ai_usage_logs table for tracking AI credits
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('analyze_contract', 'extract_expense', 'match_transaction')),
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  credits_used INTEGER DEFAULT 1 CHECK (credits_used > 0),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Simple index for user and date queries
CREATE INDEX idx_ai_usage_user_date ON public.ai_usage_logs(user_id, created_at DESC);

-- RLS policies for ai_usage_logs
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage"
  ON public.ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI usage"
  ON public.ai_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reminder', 'alert', 'success', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for unread notifications
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);

-- RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Create export_logs table
CREATE TABLE IF NOT EXISTS public.export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'pdf', 'zip')),
  file_name TEXT NOT NULL,
  file_path TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  record_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for export history
CREATE INDEX idx_export_logs_user_date ON public.export_logs(user_id, created_at DESC);

-- RLS policies for export_logs
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exports"
  ON public.export_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exports"
  ON public.export_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Add notes column to expenses table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'expenses' 
                 AND column_name = 'notes') THEN
    ALTER TABLE public.expenses ADD COLUMN notes TEXT;
  END IF;
END $$;

-- 5. Create function to get user's monthly AI credits used
CREATE OR REPLACE FUNCTION public.get_monthly_ai_credits_used(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  credits_sum INTEGER;
BEGIN
  SELECT COALESCE(SUM(credits_used), 0)::INTEGER INTO credits_sum
  FROM public.ai_usage_logs
  WHERE user_id = user_uuid
    AND created_at >= date_trunc('month', now())
    AND success = true;
  
  RETURN credits_sum;
END;
$$;

-- 6. Create function to check if user can use AI
CREATE OR REPLACE FUNCTION public.can_use_ai(user_uuid UUID, credit_limit INTEGER DEFAULT 5)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.get_monthly_ai_credits_used(user_uuid) < credit_limit;
END;
$$;