-- Make beta-screenshots bucket private
UPDATE storage.buckets SET public = false WHERE id = 'beta-screenshots';

-- Drop existing public SELECT policy if any
DROP POLICY IF EXISTS "Beta screenshots are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view beta screenshots" ON storage.objects;

-- Create authenticated-only SELECT policy
CREATE POLICY "Authenticated users can view beta screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'beta-screenshots' AND auth.role() = 'authenticated');