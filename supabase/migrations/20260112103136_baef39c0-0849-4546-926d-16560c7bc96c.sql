-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view exchange rates" ON public.exchange_rates;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view exchange rates" 
ON public.exchange_rates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);