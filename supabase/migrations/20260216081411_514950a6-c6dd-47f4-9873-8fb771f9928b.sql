
-- Table to store user's tax knowledge assessment and open-ended responses
CREATE TABLE public.tax_knowledge_assessment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  country TEXT NOT NULL DEFAULT 'CA',
  -- Knowledge self-assessment (1-5 scale)
  general_tax_knowledge INTEGER DEFAULT 1,
  business_structure_knowledge INTEGER DEFAULT 1,
  deductions_knowledge INTEGER DEFAULT 1,
  filing_deadlines_knowledge INTEGER DEFAULT 1,
  -- Open-ended responses (user can answer freely or leave null = "no sé")
  business_start_date_notes TEXT,
  employment_transition_notes TEXT,
  previous_filings_notes TEXT,
  accountant_info TEXT,
  tax_software_used TEXT,
  -- Specific knowledge gaps identified
  knowledge_gaps JSONB DEFAULT '[]'::jsonb,
  -- Contextual answers
  has_filed_before BOOLEAN,
  has_accountant BOOLEAN,
  switched_from_employee BOOLEAN,
  employee_end_date TEXT,
  first_business_revenue_date TEXT,
  knows_fiscal_year_end BOOLEAN,
  knows_gst_hst_status BOOLEAN,
  knows_tax_regime BOOLEAN,
  -- Free-form notes for anything the user wants to add
  additional_notes TEXT,
  -- Assessment completion
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.tax_knowledge_assessment ENABLE ROW LEVEL SECURITY;

-- Users can only access their own assessment
CREATE POLICY "Users can view own tax assessment"
  ON public.tax_knowledge_assessment FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax assessment"
  ON public.tax_knowledge_assessment FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax assessment"
  ON public.tax_knowledge_assessment FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_tax_knowledge_assessment_updated_at
  BEFORE UPDATE ON public.tax_knowledge_assessment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
