-- Add address and coordinate fields to mileage table for GPS tracking
ALTER TABLE public.mileage 
ADD COLUMN IF NOT EXISTS start_address TEXT,
ADD COLUMN IF NOT EXISTS end_address TEXT,
ADD COLUMN IF NOT EXISTS start_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS start_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS end_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS end_lng DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS route_snapshot_url TEXT;

-- Add address fields to clients table for smart auto-complete
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS address_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS address_lng DECIMAL(11, 8);

-- Create index for faster address lookups
CREATE INDEX IF NOT EXISTS idx_clients_address ON public.clients(address) WHERE address IS NOT NULL;