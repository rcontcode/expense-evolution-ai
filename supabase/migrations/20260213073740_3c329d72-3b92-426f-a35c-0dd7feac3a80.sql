
-- Table for recurring bills/payments with flexible frequencies
CREATE TABLE public.recurring_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'CAD',
  category TEXT NOT NULL DEFAULT 'other',
  frequency TEXT NOT NULL DEFAULT 'monthly', -- monthly, bi_monthly, quarterly, semi_annual, annual, weekly, custom
  frequency_months INTEGER, -- for custom: every N months
  due_day INTEGER, -- day of month (1-31)
  next_due_date DATE NOT NULL,
  last_paid_date DATE,
  auto_pay BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, cancelled
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  color TEXT,
  icon TEXT,
  notes TEXT,
  reminder_days_before INTEGER DEFAULT 3,
  entity_id UUID REFERENCES public.fiscal_entities(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment history / log for each bill payment
CREATE TABLE public.bill_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_id UUID NOT NULL REFERENCES public.recurring_bills(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL,
  paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  confirmation_number TEXT,
  notes TEXT,
  expense_id UUID REFERENCES public.expenses(id), -- link to expense if tracked
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for recurring_bills
CREATE POLICY "Users can view own bills" ON public.recurring_bills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bills" ON public.recurring_bills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bills" ON public.recurring_bills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bills" ON public.recurring_bills FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for bill_payments
CREATE POLICY "Users can view own payments" ON public.bill_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payments" ON public.bill_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON public.bill_payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payments" ON public.bill_payments FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_recurring_bills_user ON public.recurring_bills(user_id);
CREATE INDEX idx_recurring_bills_next_due ON public.recurring_bills(next_due_date);
CREATE INDEX idx_recurring_bills_status ON public.recurring_bills(status);
CREATE INDEX idx_bill_payments_bill ON public.bill_payments(bill_id);
CREATE INDEX idx_bill_payments_user ON public.bill_payments(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_recurring_bills_updated_at
  BEFORE UPDATE ON public.recurring_bills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
