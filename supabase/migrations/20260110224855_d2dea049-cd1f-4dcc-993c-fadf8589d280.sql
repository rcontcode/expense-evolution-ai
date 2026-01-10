-- Drop existing policies and recreate with hardened security
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

-- Create hardened RLS policies with explicit auth check
CREATE POLICY "Authenticated users can view their own clients"
ON public.clients
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own clients"
ON public.clients
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own clients"
ON public.clients
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own clients"
ON public.clients
FOR DELETE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);