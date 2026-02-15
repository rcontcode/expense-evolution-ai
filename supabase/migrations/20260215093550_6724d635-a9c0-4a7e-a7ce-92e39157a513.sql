
-- Add entity_id to category_budgets for multi-entity budgeting
ALTER TABLE public.category_budgets 
ADD COLUMN entity_id uuid REFERENCES public.fiscal_entities(id) ON DELETE SET NULL;

-- Drop existing unique constraint and create a new one that includes entity_id
-- First find and drop the existing constraint
ALTER TABLE public.category_budgets 
DROP CONSTRAINT IF EXISTS category_budgets_user_id_category_key;

-- Create new unique constraint that allows per-entity budgets
CREATE UNIQUE INDEX category_budgets_user_id_category_entity_idx 
ON public.category_budgets (user_id, category, COALESCE(entity_id, '00000000-0000-0000-0000-000000000000'));

-- Add index for entity_id lookups
CREATE INDEX idx_category_budgets_entity_id ON public.category_budgets(entity_id);
