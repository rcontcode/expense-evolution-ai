-- Fix warn: Add DELETE policy for settings table
CREATE POLICY "Users can delete their own settings" 
ON public.settings 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Fix warn: Add UPDATE policy for ai_usage_logs table
CREATE POLICY "Users can update their own AI usage logs" 
ON public.ai_usage_logs 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Fix warn: Add DELETE policy for ai_usage_logs table
CREATE POLICY "Users can delete their own AI usage logs" 
ON public.ai_usage_logs 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Fix warn: Add INSERT policy for notifications table
CREATE POLICY "Users can create their own notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);