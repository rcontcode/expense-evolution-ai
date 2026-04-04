
-- Add new columns to bank_transactions for AI intelligence
ALTER TABLE public.bank_transactions 
  ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'expense',
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurring_type TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS original_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS matched_income_id UUID REFERENCES public.income(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS auto_categorized BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS duplicate_hash TEXT;

-- Index for fast duplicate detection
CREATE INDEX IF NOT EXISTS idx_bank_transactions_duplicate_hash 
  ON public.bank_transactions(user_id, duplicate_hash);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_bank_transactions_type 
  ON public.bank_transactions(user_id, transaction_type);

-- RLS policy for the new matched_income_id (already covered by existing user_id policies)
