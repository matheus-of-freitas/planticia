-- Fix overly permissive storage policies on plant-images bucket.
-- Only the service_role (used by edge functions) should update/delete images.
-- Authenticated users can still INSERT (upload) and SELECT (view) their images.

DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- Restrict UPDATE to service_role only (no user-facing policy needed)
CREATE POLICY "Service role can update plant images"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'plant-images');

-- Restrict DELETE to service_role only (delete-plant edge function handles this)
CREATE POLICY "Service role can delete plant images"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'plant-images');
