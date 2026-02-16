
CREATE TABLE public.budget_rollovers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  month TEXT NOT NULL,
  rollover_amount NUMERIC NOT NULL DEFAULT 0,
  source_month TEXT NOT NULL,
  entity_id UUID REFERENCES public.fiscal_entities(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_budget_rollovers_unique ON public.budget_rollovers (user_id, category, month, COALESCE(entity_id, '00000000-0000-0000-0000-000000000000'));

ALTER TABLE public.budget_rollovers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own budget rollovers" ON public.budget_rollovers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
