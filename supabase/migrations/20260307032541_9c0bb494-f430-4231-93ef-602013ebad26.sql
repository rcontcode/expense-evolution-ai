
-- Drop all potentially conflicting policies and recreate
DROP POLICY IF EXISTS "Authenticated users can view beta screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own beta screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own beta screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to own beta folder" ON storage.objects;

CREATE POLICY "Users can view own beta screenshots"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'beta-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload to own beta folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'beta-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
