-- Add tracking columns for lead management
ALTER TABLE public.quiz_leads 
ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS contact_notes TEXT,
ADD COLUMN IF NOT EXISTS ghl_synced BOOLEAN DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_quiz_leads_level ON public.quiz_leads(quiz_level);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_country ON public.quiz_leads(country);
CREATE INDEX IF NOT EXISTS idx_quiz_leads_created ON public.quiz_leads(created_at DESC);