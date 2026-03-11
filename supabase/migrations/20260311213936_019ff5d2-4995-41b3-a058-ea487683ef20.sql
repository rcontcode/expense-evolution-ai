
-- automation_logs table
CREATE TABLE public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  lead_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  result_data JSONB,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automation_logs"
  ON public.automation_logs
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Extra columns on automation_rules
ALTER TABLE public.automation_rules 
  ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS execution_count INTEGER NOT NULL DEFAULT 0;
