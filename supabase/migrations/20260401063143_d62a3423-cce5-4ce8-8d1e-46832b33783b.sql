
CREATE TABLE public.admin_operational_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT,
  amount_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'monthly',
  month DATE NOT NULL DEFAULT date_trunc('month', now())::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_operational_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view operational costs"
  ON public.admin_operational_costs FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert operational costs"
  ON public.admin_operational_costs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update operational costs"
  ON public.admin_operational_costs FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete operational costs"
  ON public.admin_operational_costs FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
