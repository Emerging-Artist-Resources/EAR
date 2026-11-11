-- Public announcement card images. Admins upload; the announcement page reads the public URL.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'announcement-photos', 'announcement-photos', true, 10485760, ARRAY['image/jpeg']::text[]
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'announcement-photos');

CREATE POLICY "Admins read announcement photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'announcement-photos'
  AND public.is_admin()
);

CREATE POLICY "Admins insert announcement photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'announcement-photos'
  AND public.is_admin()
);

CREATE POLICY "Admins update announcement photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'announcement-photos'
  AND public.is_admin()
)
WITH CHECK (
  bucket_id = 'announcement-photos'
  AND public.is_admin()
);

CREATE POLICY "Admins delete announcement photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'announcement-photos'
  AND public.is_admin()
);
