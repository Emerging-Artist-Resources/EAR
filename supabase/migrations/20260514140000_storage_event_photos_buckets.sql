-- Listing images are uploaded to Storage by the app (client-side) using these bucket IDs.
-- RLS policies in remote_schema reference them, but bucket rows are often created only in the
-- hosted project dashboard — without this, local Supabase returns "Bucket not found".

INSERT INTO storage.buckets (id, name, public)
SELECT 'event-photos', 'event-photos', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'event-photos');

INSERT INTO storage.buckets (id, name, public)
SELECT 'event-photos-public', 'event-photos-public', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'event-photos-public');
