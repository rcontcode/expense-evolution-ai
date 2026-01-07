-- Drop existing policies on expenses table
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

-- Create secure RLS policies that require authentication
CREATE POLICY "Authenticated users can view their own expenses" 
ON public.expenses 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own expenses" 
ON public.expenses 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own expenses" 
ON public.expenses 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own expenses" 
ON public.expenses 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);