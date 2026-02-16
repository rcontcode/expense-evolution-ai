-- Add soft delete to mileage table
ALTER TABLE public.mileage ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for soft delete filtering
CREATE INDEX IF NOT EXISTS idx_mileage_deleted_at ON public.mileage (deleted_at) WHERE deleted_at IS NULL;