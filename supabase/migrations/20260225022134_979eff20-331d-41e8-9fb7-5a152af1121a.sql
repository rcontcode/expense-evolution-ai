
-- Ecosystem leaderboard scores (anonymous, aggregated weekly)
CREATE TABLE public.ecosystem_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_key TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Evo User',
  health_score INT NOT NULL DEFAULT 0,
  focus_minutes INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  achievements_count INT NOT NULL DEFAULT 0,
  total_score INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_key)
);

CREATE INDEX idx_ecosystem_leaderboard_week ON public.ecosystem_leaderboard(week_key, total_score DESC);

ALTER TABLE public.ecosystem_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all leaderboard entries"
  ON public.ecosystem_leaderboard FOR SELECT
  USING (true);

CREATE POLICY "Users can upsert own leaderboard"
  ON public.ecosystem_leaderboard FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own leaderboard"
  ON public.ecosystem_leaderboard FOR UPDATE
  USING (auth.uid() = user_id);
