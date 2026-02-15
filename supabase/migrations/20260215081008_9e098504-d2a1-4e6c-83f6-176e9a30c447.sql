
-- Add payment method details to recurring_bills
ALTER TABLE public.recurring_bills 
  ADD COLUMN IF NOT EXISTS payment_method_type text NOT NULL DEFAULT 'manual_online',
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS payment_details text,
  ADD COLUMN IF NOT EXISTS payee_name text,
  ADD COLUMN IF NOT EXISTS payee_account text,
  ADD COLUMN IF NOT EXISTS beneficiary text;

-- Add comment for documentation
COMMENT ON COLUMN public.recurring_bills.payment_method_type IS 'automatic, manual_online, etransfer, cash, other';
COMMENT ON COLUMN public.recurring_bills.bank_account IS 'Account number or last 4 digits';
COMMENT ON COLUMN public.recurring_bills.bank_name IS 'Name of the bank (e.g. TD, RBC, Scotiabank)';
COMMENT ON COLUMN public.recurring_bills.payment_details IS 'Additional payment instructions or notes';
COMMENT ON COLUMN public.recurring_bills.payee_name IS 'Name of the payee for e-transfers or online payments';
COMMENT ON COLUMN public.recurring_bills.payee_account IS 'Payee account number for online bill payments';
COMMENT ON COLUMN public.recurring_bills.beneficiary IS 'Who benefits from this payment (e.g. daughter, family)';
