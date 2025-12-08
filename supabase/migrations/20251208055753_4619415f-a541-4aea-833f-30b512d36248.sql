-- Add project_id to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add contract_id to expenses table to link expense to specific contract for reimbursement terms
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL;

-- Add reimbursement_type to track classification separately from workflow status
-- 'client_reimbursable' = client pays back
-- 'cra_deductible' = tax deduction only
-- 'personal' = no reimbursement
-- 'pending_classification' = needs to be classified
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS reimbursement_type text DEFAULT 'pending_classification';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_contract_id ON public.expenses(contract_id);
CREATE INDEX IF NOT EXISTS idx_expenses_reimbursement_type ON public.expenses(reimbursement_type);