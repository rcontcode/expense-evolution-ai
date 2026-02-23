
-- Add action columns to notifications table
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS snoozed_until timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS muted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_id text DEFAULT NULL;

-- Create notification_preferences table for per-type configuration
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_type text NOT NULL, -- bill_reminder, contract_reminder, tax_reminder, budget_alert
  enabled boolean NOT NULL DEFAULT true,
  advance_days integer NOT NULL DEFAULT 7,
  repeat_frequency text NOT NULL DEFAULT 'once', -- once, daily_until_deadline, weekly
  max_reminders integer NOT NULL DEFAULT 3,
  preferred_hour integer DEFAULT NULL, -- 0-23, null = anytime
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences"
  ON public.notification_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
