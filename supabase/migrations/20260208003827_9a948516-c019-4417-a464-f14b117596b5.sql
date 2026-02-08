-- 1. Add scoring columns to quiz_leads
ALTER TABLE public.quiz_leads 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'cold';

-- 2. Create lead_follow_ups table for tracking scheduled follow-ups
CREATE TABLE public.lead_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.quiz_leads(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('call', 'email', 'whatsapp', 'note', 'meeting')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create lead_interactions table for tracking interaction history
CREATE TABLE public.lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.quiz_leads(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('call', 'email', 'whatsapp', 'note', 'meeting')),
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  notes TEXT,
  outcome TEXT CHECK (outcome IN ('positive', 'neutral', 'negative', 'no_answer', NULL)),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS on new tables
ALTER TABLE public.lead_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_interactions ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for lead_follow_ups (admin only)
CREATE POLICY "Admins can view all follow-ups"
ON public.lead_follow_ups
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert follow-ups"
ON public.lead_follow_ups
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update follow-ups"
ON public.lead_follow_ups
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete follow-ups"
ON public.lead_follow_ups
FOR DELETE
USING (public.is_admin(auth.uid()));

-- 6. Create RLS policies for lead_interactions (admin only)
CREATE POLICY "Admins can view all interactions"
ON public.lead_interactions
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert interactions"
ON public.lead_interactions
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update interactions"
ON public.lead_interactions
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete interactions"
ON public.lead_interactions
FOR DELETE
USING (public.is_admin(auth.uid()));

-- 7. Create indexes for better performance
CREATE INDEX idx_lead_follow_ups_lead_id ON public.lead_follow_ups(lead_id);
CREATE INDEX idx_lead_follow_ups_scheduled_at ON public.lead_follow_ups(scheduled_at);
CREATE INDEX idx_lead_follow_ups_completed ON public.lead_follow_ups(completed_at) WHERE completed_at IS NULL;
CREATE INDEX idx_lead_interactions_lead_id ON public.lead_interactions(lead_id);
CREATE INDEX idx_lead_interactions_created_at ON public.lead_interactions(created_at DESC);
CREATE INDEX idx_quiz_leads_priority ON public.quiz_leads(priority);
CREATE INDEX idx_quiz_leads_lead_score ON public.quiz_leads(lead_score DESC);