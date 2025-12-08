-- Add extracted_terms and user_notes columns to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS extracted_terms jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS user_notes text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_processed_at timestamp with time zone DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.contracts.extracted_terms IS 'AI-extracted contract terms including reimbursement policies';
COMMENT ON COLUMN public.contracts.user_notes IS 'User corrections or notes about contract terms';
COMMENT ON COLUMN public.contracts.ai_processed_at IS 'When AI last processed this contract';