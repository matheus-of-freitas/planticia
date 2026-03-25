-- Revalidate Unsplash stock photos after tightening the matcher.
-- Existing cached rows may contain incorrect species matches from the loose v1 query.

ALTER TABLE public.stock_photos
  ADD COLUMN IF NOT EXISTS matched_query text,
  ADD COLUMN IF NOT EXISTS matcher_version text;

-- Revert persisted plant cards/details back to the user's original photo when
-- they are currently showing a cached Unsplash image.
UPDATE public.plants
SET image_url = user_image_url
WHERE user_image_url IS NOT NULL
  AND image_url LIKE 'https://images.unsplash.com/%';

-- Force all stock photo lookups to be recomputed with the stricter matcher.
DELETE FROM public.stock_photos;
