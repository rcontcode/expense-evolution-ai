
-- Lead nurturing sequences (templates for follow-up chains)
CREATE TABLE public.lead_nurturing_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_priority TEXT NOT NULL DEFAULT 'hot',
  steps JSONB NOT NULL DEFAULT '[]',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_nurturing_sequences ENABLE ROW LEVEL SECURITY;

-- Only admins can manage sequences
CREATE POLICY "Admins can manage nurturing sequences"
  ON public.lead_nurturing_sequences
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Log of nurturing steps scheduled/sent per lead
CREATE TABLE public.lead_nurturing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID REFERENCES public.lead_nurturing_sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  step_index INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  message_generated TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sequence_id, lead_id, step_index)
);

-- Enable RLS
ALTER TABLE public.lead_nurturing_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage nurturing logs
CREATE POLICY "Admins can manage nurturing logs"
  ON public.lead_nurturing_log
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Trigger for updated_at on sequences
CREATE TRIGGER update_nurturing_sequences_updated_at
  BEFORE UPDATE ON public.lead_nurturing_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
