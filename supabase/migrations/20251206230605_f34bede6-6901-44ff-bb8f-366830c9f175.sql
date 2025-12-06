-- Create table for decoded receipt codes learning
CREATE TABLE public.decoded_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_code TEXT NOT NULL,
  decoded_meaning TEXT NOT NULL,
  vendor_context TEXT,
  category TEXT,
  confidence_count INTEGER DEFAULT 1,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, original_code, vendor_context)
);

-- Enable Row Level Security
ALTER TABLE public.decoded_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own decoded codes" 
ON public.decoded_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decoded codes" 
ON public.decoded_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decoded codes" 
ON public.decoded_codes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decoded codes" 
ON public.decoded_codes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for fast lookup
CREATE INDEX idx_decoded_codes_lookup ON public.decoded_codes(user_id, original_code);
CREATE INDEX idx_decoded_codes_vendor ON public.decoded_codes(user_id, vendor_context);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_decoded_codes_updated_at
BEFORE UPDATE ON public.decoded_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();