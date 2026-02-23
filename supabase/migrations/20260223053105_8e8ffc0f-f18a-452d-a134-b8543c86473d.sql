
-- Create budget_alert_rules table
CREATE TABLE public.budget_alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  condition_type TEXT NOT NULL DEFAULT 'exceeds',
  threshold_amount NUMERIC NOT NULL DEFAULT 0,
  threshold_percentage NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notify_method TEXT NOT NULL DEFAULT 'in_app',
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  entity_id UUID REFERENCES public.fiscal_entities(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert rules"
  ON public.budget_alert_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alert rules"
  ON public.budget_alert_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert rules"
  ON public.budget_alert_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alert rules"
  ON public.budget_alert_rules FOR DELETE
  USING (auth.uid() = user_id);
