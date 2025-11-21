-- Create storage bucket for contracts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
);

-- RLS policies for contracts bucket
CREATE POLICY "Users can view their own contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own contracts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own contracts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contracts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own contracts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'contracts' AND
  auth.uid()::text = (storage.foldername(name))[1]
);