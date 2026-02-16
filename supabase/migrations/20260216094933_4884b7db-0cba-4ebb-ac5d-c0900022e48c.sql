
-- Add soft delete column to main tables
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.income ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create indexes for efficient filtering of non-deleted records
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON public.expenses (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_income_deleted_at ON public.income (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at ON public.clients (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON public.projects (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contracts_deleted_at ON public.contracts (deleted_at) WHERE deleted_at IS NULL;
