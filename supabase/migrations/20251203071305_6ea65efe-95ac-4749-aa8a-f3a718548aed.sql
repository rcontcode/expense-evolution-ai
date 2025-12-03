-- Fix security: Ensure only authenticated users can access profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- Fix security: Ensure only authenticated users can access bank_transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.bank_transactions;
CREATE POLICY "Users can view their own transactions" 
ON public.bank_transactions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.bank_transactions;
CREATE POLICY "Users can insert their own transactions" 
ON public.bank_transactions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.bank_transactions;
CREATE POLICY "Users can update their own transactions" 
ON public.bank_transactions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.bank_transactions;
CREATE POLICY "Users can delete their own transactions" 
ON public.bank_transactions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);