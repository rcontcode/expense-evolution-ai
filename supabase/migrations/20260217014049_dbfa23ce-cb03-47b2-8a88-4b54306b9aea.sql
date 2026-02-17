
CREATE OR REPLACE FUNCTION public.get_user_beta_stats(target_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Only allow users to view their own stats, or admins to view any
  IF target_user_id != auth.uid() AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot view other users'' statistics';
  END IF;

  SELECT jsonb_build_object(
    'total_actions', COUNT(*),
    'unique_features', COUNT(DISTINCT feature_name),
    'unique_pages', COUNT(DISTINCT page_path),
    'first_activity', MIN(created_at),
    'last_activity', MAX(created_at),
    'days_active', COUNT(DISTINCT DATE(created_at))
  ) INTO result
  FROM public.feature_usage_logs
  WHERE user_id = target_user_id;

  RETURN result;
END;
$$;
