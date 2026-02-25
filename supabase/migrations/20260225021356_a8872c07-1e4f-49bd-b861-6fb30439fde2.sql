
-- Ecosystem notifications table for cross-app notification bridge
CREATE TABLE public.ecosystem_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_app TEXT NOT NULL DEFAULT 'evofinz',
  notification_type TEXT NOT NULL,
  title_es TEXT NOT NULL,
  title_en TEXT NOT NULL,
  message_es TEXT NOT NULL,
  message_en TEXT NOT NULL,
  action_url TEXT,
  action_tool TEXT,
  emoji TEXT DEFAULT '📌',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX idx_ecosystem_notifications_user ON public.ecosystem_notifications(user_id, is_read, created_at DESC);

-- RLS
ALTER TABLE public.ecosystem_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.ecosystem_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.ecosystem_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.ecosystem_notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ecosystem streaks table
CREATE TABLE public.ecosystem_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INT NOT NULL DEFAULT 0,
  best_streak INT NOT NULL DEFAULT 0,
  last_activity_date DATE,
  focus_days_this_week INT NOT NULL DEFAULT 0,
  finance_days_this_week INT NOT NULL DEFAULT 0,
  combined_days_this_week INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.ecosystem_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own streaks"
  ON public.ecosystem_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own streaks"
  ON public.ecosystem_streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON public.ecosystem_streaks FOR UPDATE
  USING (auth.uid() = user_id);
