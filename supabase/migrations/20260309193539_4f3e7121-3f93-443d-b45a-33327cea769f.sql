
-- Saved message templates (new table)
CREATE TABLE IF NOT EXISTS public.lead_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  message_type text NOT NULL DEFAULT 'whatsapp',
  template_type text NOT NULL DEFAULT 'first_contact',
  target_app text NOT NULL DEFAULT 'evofinz',
  language text NOT NULL DEFAULT 'es',
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  use_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_message_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins can manage templates"
  ON public.lead_message_templates FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add pipeline_stage if missing
ALTER TABLE public.quiz_leads ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'new';

-- Ensure RLS policy exists for lead_interactions
DO $$ BEGIN
  CREATE POLICY "Admins can manage lead interactions"
  ON public.lead_interactions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
