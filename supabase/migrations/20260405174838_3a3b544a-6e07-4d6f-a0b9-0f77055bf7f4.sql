
CREATE TABLE public.bank_import_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  imported_at timestamptz DEFAULT now(),
  source_type text NOT NULL DEFAULT 'csv',
  file_name text,
  total_transactions int DEFAULT 0,
  duplicates_found int DEFAULT 0,
  duplicates_skipped int DEFAULT 0,
  income_count int DEFAULT 0,
  expense_count int DEFAULT 0,
  income_total numeric DEFAULT 0,
  expense_total numeric DEFAULT 0,
  recurring_count int DEFAULT 0,
  unclassified_count int DEFAULT 0,
  expenses_created int DEFAULT 0,
  income_created int DEFAULT 0,
  categories jsonb DEFAULT '{}',
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.bank_import_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own import sessions" ON public.bank_import_sessions FOR ALL USING (auth.uid() = user_id);
