
CREATE OR REPLACE FUNCTION public.unlock_achievement(
  p_achievement_key text,
  p_achievement_name text DEFAULT '',
  p_achievement_description text DEFAULT '',
  p_points integer DEFAULT 0
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_existing_id uuid;
  v_new_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if already unlocked
  SELECT id INTO v_existing_id
  FROM public.user_achievements
  WHERE user_id = v_user_id AND achievement_key = p_achievement_key;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  -- Insert new achievement
  INSERT INTO public.user_achievements (user_id, achievement_key, achievement_name, achievement_description, points)
  VALUES (v_user_id, p_achievement_key, p_achievement_name, p_achievement_description, p_points)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;
