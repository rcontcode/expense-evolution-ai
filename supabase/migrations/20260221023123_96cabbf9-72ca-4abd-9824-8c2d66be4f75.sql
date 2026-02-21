-- Add document_id to income table to link income records to source documents
ALTER TABLE public.income ADD COLUMN document_id uuid REFERENCES public.documents(id);

-- Create index for efficient lookups
CREATE INDEX idx_income_document_id ON public.income(document_id);
