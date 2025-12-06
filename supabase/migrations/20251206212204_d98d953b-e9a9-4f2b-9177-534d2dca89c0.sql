-- Create scan_sessions table to track scanning sessions
CREATE TABLE public.scan_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  receipts_captured INTEGER DEFAULT 0,
  receipts_approved INTEGER DEFAULT 0,
  receipts_rejected INTEGER DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  device_type TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own scan sessions"
ON public.scan_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan sessions"
ON public.scan_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan sessions"
ON public.scan_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scan sessions"
ON public.scan_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_scan_sessions_user_date ON public.scan_sessions(user_id, started_at DESC);

-- Enable realtime for scan sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_sessions;