-- Add columns to documents table for AI extraction data and review workflow
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS extracted_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'pending_review',
ADD COLUMN IF NOT EXISTS user_corrections text,
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL;

-- Create index for faster filtering by review status
CREATE INDEX IF NOT EXISTS idx_documents_review_status ON public.documents(user_id, review_status);

-- Enable realtime for documents table so mobile uploads sync to desktop
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;