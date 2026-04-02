
CREATE TABLE public.mission_control_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_key TEXT NOT NULL,
  global_score INTEGER NOT NULL DEFAULT 0,
  system_fuel_score INTEGER NOT NULL DEFAULT 0,
  features_ready INTEGER NOT NULL DEFAULT 0,
  features_total INTEGER NOT NULL DEFAULT 8,
  categories_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_key)
);

ALTER TABLE public.mission_control_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
ON public.mission_control_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history"
ON public.mission_control_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history"
ON public.mission_control_history FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
