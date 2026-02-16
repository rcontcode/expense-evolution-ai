
-- Generalized audit log table
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'restore'
  entity_type TEXT NOT NULL, -- 'expense', 'income', 'client', 'project', 'contract'
  entity_id UUID,
  entity_name TEXT, -- human-readable name for display
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user queries
CREATE INDEX idx_audit_log_user_created ON public.audit_log (user_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON public.audit_log (entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audit log
CREATE POLICY "Users can view own audit log"
  ON public.audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own audit log entries
CREATE POLICY "Users can insert own audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Data health check view: orphaned records
CREATE OR REPLACE VIEW public.data_health_check
WITH (security_invoker=on) AS
SELECT 
  'expense_no_client' as issue_type,
  e.id as record_id,
  'expense' as entity_type,
  COALESCE(e.vendor, 'Sin vendedor') as record_name,
  e.amount::text as detail,
  e.date as record_date
FROM expenses e
WHERE e.deleted_at IS NULL
  AND e.client_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = e.client_id AND c.deleted_at IS NULL)

UNION ALL

SELECT 
  'expense_no_project',
  e.id,
  'expense',
  COALESCE(e.vendor, 'Sin vendedor'),
  e.amount::text,
  e.date
FROM expenses e
WHERE e.deleted_at IS NULL
  AND e.project_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = e.project_id AND p.deleted_at IS NULL)

UNION ALL

SELECT 
  'income_no_client',
  i.id,
  'income',
  COALESCE(i.source, 'Sin fuente'),
  i.amount::text,
  i.date
FROM income i
WHERE i.deleted_at IS NULL
  AND i.client_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM clients c WHERE c.id = i.client_id AND c.deleted_at IS NULL)

UNION ALL

SELECT 
  'income_no_project',
  i.id,
  'income',
  COALESCE(i.source, 'Sin fuente'),
  i.amount::text,
  i.date
FROM income i
WHERE i.deleted_at IS NULL
  AND i.project_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = i.project_id AND p.deleted_at IS NULL)

UNION ALL

SELECT 
  'expense_no_entity',
  e.id,
  'expense',
  COALESCE(e.vendor, 'Sin vendedor'),
  e.amount::text,
  e.date
FROM expenses e
WHERE e.deleted_at IS NULL
  AND e.entity_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM fiscal_entities fe WHERE fe.id = e.entity_id)

UNION ALL

SELECT
  'expense_unclassified',
  e.id,
  'expense',
  COALESCE(e.vendor, 'Sin vendedor'),
  e.amount::text,
  e.date
FROM expenses e
WHERE e.deleted_at IS NULL
  AND (e.reimbursement_type IS NULL OR e.reimbursement_type = 'pending_classification');
