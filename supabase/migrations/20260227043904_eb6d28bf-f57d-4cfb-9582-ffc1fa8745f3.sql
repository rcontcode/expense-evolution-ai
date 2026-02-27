-- Secure function to get leaderboard without exposing user_id
CREATE OR REPLACE FUNCTION public.get_ecosystem_leaderboard(p_week_key text DEFAULT NULL)
RETURNS TABLE (
  rank bigint,
  display_name text,
  total_score integer,
  health_score integer,
  streak_days integer,
  focus_minutes integer,
  achievements_count integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ROW_NUMBER() OVER (ORDER BY el.total_score DESC) as rank,
    el.display_name,
    el.total_score,
    el.health_score,
    el.streak_days,
    el.focus_minutes,
    el.achievements_count
  FROM ecosystem_leaderboard el
  WHERE el.week_key = COALESCE(p_week_key, to_char(now(), 'IYYY-IW'))
  ORDER BY el.total_score DESC
  LIMIT 50;
$$;