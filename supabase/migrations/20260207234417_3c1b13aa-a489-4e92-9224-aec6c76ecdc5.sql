-- Add comments field to quiz_leads table to capture free-text input from users
ALTER TABLE public.quiz_leads 
ADD COLUMN comments TEXT;