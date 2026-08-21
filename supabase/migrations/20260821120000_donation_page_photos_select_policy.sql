-- Environments that already applied 20260819120000 before SELECT was added need this policy
-- for client uploads with upsert: true. Idempotent if the policy already exists.

DROP POLICY IF EXISTS "Users read own donation page photo" ON storage.objects;

CREATE POLICY "Users read own donation page photo"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'donation-page-photos'
  AND name LIKE 'profiles/' || auth.uid()::text || '/%'
);
