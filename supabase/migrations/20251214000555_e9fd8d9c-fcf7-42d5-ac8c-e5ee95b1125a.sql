-- Create financial_journal table for Jim Rohn's reflection practice
CREATE TABLE public.financial_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_type TEXT NOT NULL DEFAULT 'reflection',
  content TEXT NOT NULL,
  related_expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  related_income_id UUID REFERENCES public.income(id) ON DELETE SET NULL,
  mood TEXT,
  lessons_learned TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_habits table for Brian Tracy's habit tracking
CREATE TABLE public.financial_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_name TEXT NOT NULL,
  habit_description TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  target_per_period INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  xp_reward INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_habit_logs for tracking completions
CREATE TABLE public.financial_habit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  habit_id UUID NOT NULL REFERENCES public.financial_habits(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create financial_education table for education tracking
CREATE TABLE public.financial_education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'book',
  title TEXT NOT NULL,
  author TEXT,
  url TEXT,
  started_date DATE,
  completed_date DATE,
  status TEXT DEFAULT 'in_progress',
  key_lessons TEXT,
  impact_rating INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pay_yourself_first_settings for tracking savings-first approach
CREATE TABLE public.pay_yourself_first_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  target_percentage NUMERIC DEFAULT 20,
  current_month_saved NUMERIC DEFAULT 0,
  current_month_income NUMERIC DEFAULT 0,
  streak_months INTEGER DEFAULT 0,
  best_streak_months INTEGER DEFAULT 0,
  last_payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.financial_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pay_yourself_first_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for financial_journal
CREATE POLICY "Users can view their own journal entries" ON public.financial_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own journal entries" ON public.financial_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journal entries" ON public.financial_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journal entries" ON public.financial_journal FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for financial_habits
CREATE POLICY "Users can view their own habits" ON public.financial_habits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own habits" ON public.financial_habits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own habits" ON public.financial_habits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habits" ON public.financial_habits FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for financial_habit_logs
CREATE POLICY "Users can view their own habit logs" ON public.financial_habit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own habit logs" ON public.financial_habit_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own habit logs" ON public.financial_habit_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for financial_education
CREATE POLICY "Users can view their own education" ON public.financial_education FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own education" ON public.financial_education FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own education" ON public.financial_education FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own education" ON public.financial_education FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for pay_yourself_first_settings
CREATE POLICY "Users can view their own pyf settings" ON public.pay_yourself_first_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own pyf settings" ON public.pay_yourself_first_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own pyf settings" ON public.pay_yourself_first_settings FOR UPDATE USING (auth.uid() = user_id);

-- Add debt_type column to liabilities for good vs bad debt classification
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS debt_type TEXT DEFAULT 'bad';
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS generates_income BOOLEAN DEFAULT false;
ALTER TABLE public.liabilities ADD COLUMN IF NOT EXISTS monthly_income_generated NUMERIC DEFAULT 0;

-- Add SMART goal fields to investment_goals and savings_goals
ALTER TABLE public.investment_goals ADD COLUMN IF NOT EXISTS is_specific BOOLEAN DEFAULT false;
ALTER TABLE public.investment_goals ADD COLUMN IF NOT EXISTS is_measurable BOOLEAN DEFAULT true;
ALTER TABLE public.investment_goals ADD COLUMN IF NOT EXISTS is_achievable BOOLEAN;
ALTER TABLE public.investment_goals ADD COLUMN IF NOT EXISTS is_relevant BOOLEAN DEFAULT false;
ALTER TABLE public.investment_goals ADD COLUMN IF NOT EXISTS relevance_reason TEXT;

ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS is_specific BOOLEAN DEFAULT false;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS is_measurable BOOLEAN DEFAULT true;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS is_achievable BOOLEAN;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS is_relevant BOOLEAN DEFAULT false;
ALTER TABLE public.savings_goals ADD COLUMN IF NOT EXISTS relevance_reason TEXT;