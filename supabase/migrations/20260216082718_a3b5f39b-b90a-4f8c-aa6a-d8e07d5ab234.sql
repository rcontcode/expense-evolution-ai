
ALTER TABLE public.tax_knowledge_assessment
  ADD COLUMN IF NOT EXISTS gst_registration_date text,
  ADD COLUMN IF NOT EXISTS iva_registration_date text,
  ADD COLUMN IF NOT EXISTS gst_filing_frequency text,
  ADD COLUMN IF NOT EXISTS iva_filing_frequency text,
  ADD COLUMN IF NOT EXISTS revenue_pattern text,
  ADD COLUMN IF NOT EXISTS revenue_range text,
  ADD COLUMN IF NOT EXISTS business_tax_id text,
  ADD COLUMN IF NOT EXISTS knows_personal_tax_deadline boolean;
