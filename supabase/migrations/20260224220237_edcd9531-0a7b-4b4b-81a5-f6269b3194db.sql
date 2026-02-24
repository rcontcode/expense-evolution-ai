
-- 1. Feature Flags table
CREATE TABLE public.feature_flags (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  label text,
  description text,
  category text NOT NULL DEFAULT 'general',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read flags
CREATE POLICY "Authenticated users can read feature flags"
ON public.feature_flags FOR SELECT
TO authenticated
USING (true);

-- Admins can manage flags
CREATE POLICY "Admins can insert feature flags"
ON public.feature_flags FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update feature flags"
ON public.feature_flags FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete feature flags"
ON public.feature_flags FOR DELETE
USING (public.is_admin(auth.uid()));

-- 2. Add has_bundle to user_subscriptions
ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS has_bundle boolean NOT NULL DEFAULT false;

-- 3. Financial focus sessions table
CREATE TABLE public.financial_focus_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_type text NOT NULL,
  duration_minutes integer NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  xp_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own focus sessions"
ON public.financial_focus_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own focus sessions"
ON public.financial_focus_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own focus sessions"
ON public.financial_focus_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- 4. Financial worry entries table
CREATE TABLE public.financial_worry_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content text NOT NULL,
  worry_category text NOT NULL DEFAULT 'general',
  released boolean NOT NULL DEFAULT false,
  converted_to_journal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_worry_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own worry entries"
ON public.financial_worry_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own worry entries"
ON public.financial_worry_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own worry entries"
ON public.financial_worry_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own worry entries"
ON public.financial_worry_entries FOR DELETE
USING (auth.uid() = user_id);
