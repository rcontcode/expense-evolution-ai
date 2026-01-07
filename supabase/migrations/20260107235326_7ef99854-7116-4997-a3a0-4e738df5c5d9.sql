-- Add country and Chile-specific fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'CA',
ADD COLUMN IF NOT EXISTS rut TEXT,
ADD COLUMN IF NOT EXISTS tax_regime TEXT;