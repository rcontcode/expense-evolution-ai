ALTER TABLE public.contracts ADD COLUMN group_id uuid DEFAULT NULL;
ALTER TABLE public.contracts ADD COLUMN page_order integer DEFAULT 0;