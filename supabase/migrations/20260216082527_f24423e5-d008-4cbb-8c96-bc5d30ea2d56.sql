
ALTER TABLE public.tax_knowledge_assessment
  ADD COLUMN IF NOT EXISTS business_registration_date text,
  ADD COLUMN IF NOT EXISTS business_legal_name text,
  ADD COLUMN IF NOT EXISTS has_separate_bank_account boolean,
  ADD COLUMN IF NOT EXISTS uses_home_office boolean,
  ADD COLUMN IF NOT EXISTS home_office_details text,
  ADD COLUMN IF NOT EXISTS uses_vehicle_for_business boolean,
  ADD COLUMN IF NOT EXISTS has_international_income boolean,
  ADD COLUMN IF NOT EXISTS international_income_details text,
  ADD COLUMN IF NOT EXISTS pays_tax_installments boolean,
  ADD COLUMN IF NOT EXISTS record_keeping_method text,
  ADD COLUMN IF NOT EXISTS has_tax_debts boolean,
  ADD COLUMN IF NOT EXISTS tax_debts_details text,
  ADD COLUMN IF NOT EXISTS has_employees boolean;
