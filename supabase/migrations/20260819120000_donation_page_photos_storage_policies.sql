-- donation-page-photos bucket exists in production (public, 10MB, image/*).
-- Local dev may not have the bucket row; policies are required for authenticated uploads.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'donation-page-photos', 'donation-page-photos', true, 10485760, ARRAY['image/*']::text[]
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'donation-page-photos');

-- Required for client uploads with upsert: true (Storage checks for an existing object first).
-- Scoped to the caller's folder so the bucket is not listable by other users.
CREATE POLICY "Users read own donation page photo"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-page-photos'
  AND name LIKE 'profiles/' || auth.uid()::text || '/%'
);

CREATE POLICY "Users upload own donation page photo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'donation-page-photos'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users update own donation page photo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'donation-page-photos'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'donation-page-photos'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users delete own donation page photo"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'donation-page-photos'
  AND (storage.foldername(name))[1] = 'profiles'
  AND (storage.foldername(name))[2] = auth.uid()::text
);
