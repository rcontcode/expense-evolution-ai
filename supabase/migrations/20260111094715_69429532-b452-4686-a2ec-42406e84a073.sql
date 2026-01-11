-- Create quiz_leads table to store lead capture data
CREATE TABLE public.quiz_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  situation TEXT,
  goal TEXT,
  obstacle TEXT,
  time_spent TEXT,
  quiz_score INTEGER,
  quiz_level TEXT,
  failed_questions INTEGER[],
  converted_to_user BOOLEAN DEFAULT false,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on email for fast lookups
CREATE INDEX idx_quiz_leads_email ON public.quiz_leads(email);

-- Create index on created_at for analytics
CREATE INDEX idx_quiz_leads_created_at ON public.quiz_leads(created_at DESC);

-- Enable RLS
ALTER TABLE public.quiz_leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public quiz)
CREATE POLICY "Anyone can submit quiz leads"
ON public.quiz_leads
FOR INSERT
WITH CHECK (true);

-- Only authenticated admins can view leads (we'll add admin check later)
CREATE POLICY "Admins can view quiz leads"
ON public.quiz_leads
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add updated_at trigger
CREATE TRIGGER update_quiz_leads_updated_at
BEFORE UPDATE ON public.quiz_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();