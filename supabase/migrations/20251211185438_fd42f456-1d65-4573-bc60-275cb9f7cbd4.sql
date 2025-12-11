-- Add business profile fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS business_number text,
ADD COLUMN IF NOT EXISTS gst_hst_registered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS business_start_date date,
ADD COLUMN IF NOT EXISTS fiscal_year_end text DEFAULT 'December 31';