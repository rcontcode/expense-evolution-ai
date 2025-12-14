-- Add columns for progress tracking and practice in financial_education table
ALTER TABLE public.financial_education 
ADD COLUMN IF NOT EXISTS progress_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pages_read INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_pages INTEGER,
ADD COLUMN IF NOT EXISTS minutes_consumed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_minutes INTEGER,
ADD COLUMN IF NOT EXISTS daily_goal_pages INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS suggested_resource_id TEXT,
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create practice tracking table
CREATE TABLE IF NOT EXISTS public.education_practice_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_id UUID REFERENCES public.financial_education(id) ON DELETE CASCADE,
  suggested_resource_id TEXT,
  practice_description TEXT NOT NULL,
  practice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  practice_type TEXT DEFAULT 'action',
  outcome TEXT,
  impact_rating INTEGER CHECK (impact_rating >= 1 AND impact_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.education_practice_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own practice logs"
ON public.education_practice_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own practice logs"
ON public.education_practice_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice logs"
ON public.education_practice_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own practice logs"
ON public.education_practice_logs FOR DELETE
USING (auth.uid() = user_id);

-- Create daily reading logs table
CREATE TABLE IF NOT EXISTS public.education_daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_id UUID REFERENCES public.financial_education(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pages_read INTEGER DEFAULT 0,
  minutes_consumed INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, resource_id, log_date)
);

-- Enable RLS
ALTER TABLE public.education_daily_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own daily logs"
ON public.education_daily_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily logs"
ON public.education_daily_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs"
ON public.education_daily_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily logs"
ON public.education_daily_logs FOR DELETE
USING (auth.uid() = user_id);