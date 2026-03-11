
-- Add tags column to quiz_leads
ALTER TABLE public.quiz_leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create automation_rules table
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'new_lead',
  trigger_condition JSONB DEFAULT '{}',
  action_type TEXT NOT NULL DEFAULT 'email',
  action_config JSONB DEFAULT '{}',
  delay_minutes INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automation rules"
  ON public.automation_rules FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
