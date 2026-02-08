-- =============================================================
-- Extended User Life Profile for Personalized Experience
-- Enables Phoenix to provide ultra-personalized motivation and advice
-- =============================================================

-- Add life profile fields to profiles table (personal identity data)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS nickname text,
ADD COLUMN IF NOT EXISTS avatar_mood text DEFAULT 'neutral',
ADD COLUMN IF NOT EXISTS profile_completion_percentage integer DEFAULT 0;

-- Create extended life profile table for rich personal data
CREATE TABLE IF NOT EXISTS public.user_life_profile (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Family & Relationships
  relationship_status text, -- single, partnered, married, divorced, widowed
  has_children boolean DEFAULT false,
  children_count integer DEFAULT 0,
  children_ages text[], -- e.g., ['5', '12', 'adult']
  dependents_count integer DEFAULT 0, -- elderly parents, etc.
  pets text[], -- e.g., ['dog', 'cat']
  
  -- Work & Career
  employment_status text, -- employed, self_employed, unemployed, retired, student
  job_title text,
  industry text,
  company_size text, -- startup, small, medium, large, enterprise
  years_experience integer,
  career_goals text[], -- e.g., ['promotion', 'career_change', 'entrepreneurship']
  side_hustle boolean DEFAULT false,
  side_hustle_type text,
  
  -- Lifestyle & Interests
  hobbies text[], -- e.g., ['gaming', 'reading', 'sports', 'cooking', 'travel']
  sports text[], -- e.g., ['soccer', 'running', 'gym', 'swimming']
  passions text[], -- deeper interests beyond hobbies
  daily_routine text, -- morning_person, night_owl, flexible
  work_life_balance text, -- struggle, balanced, prioritize_life
  
  -- Dreams & Aspirations
  life_dreams text[], -- e.g., ['travel_world', 'own_home', 'retire_early', 'start_business']
  bucket_list text[], -- specific items: 'visit_japan', 'learn_piano'
  biggest_fears text[], -- financial: 'debt', 'job_loss', 'not_saving_enough'
  motivations text[], -- what drives them: 'family', 'freedom', 'security', 'legacy'
  role_models text, -- people they admire
  
  -- Financial Psychology
  money_personality text, -- spender, saver, avoider, worrier, planner
  biggest_financial_mistake text,
  proudest_financial_achievement text,
  financial_fears text[], -- specific fears
  
  -- Celebrations & Milestones
  birthday_month integer, -- 1-12 for birthday messages
  anniversary_date date, -- wedding/partnership anniversary
  custom_milestones jsonb DEFAULT '[]'::jsonb, -- custom dates to celebrate
  
  -- Progress tracking
  sections_completed text[] DEFAULT '{}', -- ['basic', 'family', 'work', 'lifestyle', 'dreams']
  last_profile_prompt timestamp with time zone,
  profile_prompts_dismissed integer DEFAULT 0,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_life_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies - users can only access their own profile
CREATE POLICY "Users can view their own life profile"
ON public.user_life_profile FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own life profile"
ON public.user_life_profile FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own life profile"
ON public.user_life_profile FOR UPDATE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_life_profile_user_id ON public.user_life_profile(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_life_profile_updated_at
BEFORE UPDATE ON public.user_life_profile
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();