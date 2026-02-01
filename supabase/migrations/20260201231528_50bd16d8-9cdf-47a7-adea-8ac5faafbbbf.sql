-- Add voice_minutes_used column to usage_tracking
ALTER TABLE public.usage_tracking
ADD COLUMN IF NOT EXISTS voice_minutes_used DECIMAL(10,2) DEFAULT 0;

-- Create or replace function to increment voice usage
CREATE OR REPLACE FUNCTION public.increment_voice_usage(
  p_user_id UUID,
  p_minutes DECIMAL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, period_start, voice_minutes_used)
  VALUES (
    p_user_id, 
    DATE_TRUNC('month', CURRENT_DATE)::DATE,
    p_minutes
  )
  ON CONFLICT (user_id, period_start) 
  DO UPDATE SET 
    voice_minutes_used = COALESCE(usage_tracking.voice_minutes_used, 0) + p_minutes,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;