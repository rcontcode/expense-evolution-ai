-- Investment goals table
CREATE TABLE public.investment_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  goal_type TEXT NOT NULL DEFAULT 'passive_income',
  target_amount NUMERIC NOT NULL DEFAULT 0,
  current_amount NUMERIC DEFAULT 0,
  monthly_target NUMERIC DEFAULT 0,
  asset_class TEXT,
  risk_level TEXT DEFAULT 'moderate',
  deadline DATE,
  color TEXT DEFAULT '#8B5CF6',
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User financial profile (passions, talents, preferences)
CREATE TABLE public.user_financial_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  passions TEXT[] DEFAULT '{}',
  talents TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  available_capital NUMERIC DEFAULT 0,
  monthly_investment_capacity NUMERIC DEFAULT 0,
  risk_tolerance TEXT DEFAULT 'moderate',
  time_availability TEXT DEFAULT 'part_time',
  preferred_income_type TEXT DEFAULT 'mixed',
  financial_education_level TEXT DEFAULT 'beginner',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User achievements for gamification
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  progress NUMERIC DEFAULT 0,
  UNIQUE(user_id, achievement_key)
);

-- User financial level for gamification
CREATE TABLE public.user_financial_level (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  total_savings NUMERIC DEFAULT 0,
  total_investments NUMERIC DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_financial_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_financial_level ENABLE ROW LEVEL SECURITY;

-- RLS Policies for investment_goals
CREATE POLICY "Users can view their own investment goals" ON public.investment_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own investment goals" ON public.investment_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investment goals" ON public.investment_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own investment goals" ON public.investment_goals FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_financial_profile
CREATE POLICY "Users can view their own financial profile" ON public.user_financial_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own financial profile" ON public.user_financial_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own financial profile" ON public.user_financial_profile FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON public.user_achievements FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_financial_level
CREATE POLICY "Users can view their own level" ON public.user_financial_level FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own level" ON public.user_financial_level FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own level" ON public.user_financial_level FOR UPDATE USING (auth.uid() = user_id);