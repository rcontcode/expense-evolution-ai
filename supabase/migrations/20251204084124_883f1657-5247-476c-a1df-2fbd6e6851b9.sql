-- Agregar campos adicionales a la tabla clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'private',
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CAD',
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Agregar campos adicionales a la tabla contracts
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'services',
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS renewal_notice_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS value NUMERIC,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS reimbursement_terms JSONB DEFAULT '{}'::jsonb;

-- Crear índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_clients_industry ON public.clients(industry);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON public.clients(client_type);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON public.contracts(contract_type);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON public.contracts(end_date);