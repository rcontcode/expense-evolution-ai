-- Add INSERT policy to profiles table to prevent unauthorized profile creation
-- Profiles should ONLY be created by the handle_new_user() trigger, not manually
-- This policy ensures that even if someone tries to insert, they can only insert their own profile

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);