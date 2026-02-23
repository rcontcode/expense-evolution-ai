
-- Fix SELECT policy: restrict to own files or admin
DROP POLICY IF EXISTS "Authenticated users can view beta screenshots" ON storage.objects;

CREATE POLICY "Users can view own beta screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'beta-screenshots' AND 
  (auth.uid()::text = (storage.foldername(name))[1] 
   OR public.is_admin(auth.uid()))
);

-- Fix INSERT policy: enforce folder structure
DROP POLICY IF EXISTS "Users can upload their own beta screenshots" ON storage.objects;

CREATE POLICY "Users can upload own beta screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'beta-screenshots' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
